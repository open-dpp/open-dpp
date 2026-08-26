import { ForbiddenException, Injectable } from "@nestjs/common";
import { BulkImportRunStatusDto } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { Pagination } from "../../../pagination/pagination";
import { DbSessionOptions } from "../../../database/query-options";
import { TransactionService } from "../../../database/transaction.service";
import { TemplateRepository } from "../../../templates/infrastructure/template.repository";
import { BulkImportConfig } from "../../domain/bulk-import-config";
import { FieldMapping } from "../../domain/field-mapping";
import { JsonTransformer } from "../../domain/json-transformer";
import { BulkImportConfigRepository } from "../../infrastructure/bulk-import-config.repository";
import { BulkImportRunItemRepository } from "../../infrastructure/bulk-import-run-item.repository";
import { BulkImportRunRepository } from "../../infrastructure/bulk-import-run.repository";
import { BulkImportRun } from "../../domain/bulk-import-run";

export interface SubmodelFieldMappingInput {
  submodelIdShort: string;
  fieldMappings: { input: string; output: string }[];
}

@Injectable()
export class BulkImportConfigService {
  constructor(
    private readonly bulkImportConfigRepository: BulkImportConfigRepository,
    private readonly bulkImportRunRepository: BulkImportRunRepository,
    private readonly bulkImportRunItemRepository: BulkImportRunItemRepository,
    private readonly templateRepository: TemplateRepository,
    private readonly transactionService: TransactionService,
  ) {}

  async createConfig(data: {
    organizationId: string;
    templateId: string;
    name: string;
    idField: string;
    submodelMappings: SubmodelFieldMappingInput[];
    inputSample?: Record<string, unknown> | null;
  }): Promise<BulkImportConfig> {
    await this.checkTemplateOwnership(data.templateId, data.organizationId);

    const config = BulkImportConfig.create({
      organizationId: data.organizationId,
      templateId: data.templateId,
      name: data.name,
      idField: data.idField,
      submodelMappings: toTransformerMap(data.submodelMappings),
      inputSample: data.inputSample ?? null,
    });
    return await this.bulkImportConfigRepository.save(config);
  }

  async updateConfig(
    id: string,
    organizationId: string,
    data: {
      name?: string;
      idField?: string;
      submodelMappings?: SubmodelFieldMappingInput[];
      inputSample?: Record<string, unknown> | null;
    },
  ): Promise<BulkImportConfig> {
    const config = await this.loadAndCheckOwnership(id, organizationId);
    await this.assertConfigIsEditable(id);
    config.updateMapping({
      name: data.name,
      idField: data.idField,
      submodelMappings: data.submodelMappings ? toTransformerMap(data.submodelMappings) : undefined,
      inputSample: data.inputSample,
    });
    return await this.bulkImportConfigRepository.save(config);
  }

  async findById(id: string, organizationId: string): Promise<BulkImportConfig> {
    return await this.loadAndCheckOwnership(id, organizationId);
  }

  async findAllByOrganizationId(
    organizationId: string,
    templateId?: string,
  ): Promise<BulkImportConfig[]> {
    return await this.bulkImportConfigRepository.findAllByOrganizationId(organizationId, {
      templateId,
    });
  }

  async deleteConfig(id: string, organizationId: string): Promise<void> {
    await this.loadAndCheckOwnership(id, organizationId);
    await this.assertConfigIsEditable(id);
    await this.transactionService.withTransaction(async (options) => {
      const deletedRunIds = await this.bulkImportRunRepository.deleteAllByBulkImportConfigId(
        id,
        options,
      );
      await this.bulkImportRunItemRepository.deleteAllByRunIds(deletedRunIds, options);
      await this.bulkImportConfigRepository.deleteById(id, options);
    });
  }

  /** Cascades to every config targeting the template, and each config's own run history. */
  async deleteAllByTemplateId(templateId: string, options?: DbSessionOptions): Promise<void> {
    const configs = await this.bulkImportConfigRepository.findAllByTemplateId(templateId);
    for (const config of configs) {
      const deletedRunIds = await this.bulkImportRunRepository.deleteAllByBulkImportConfigId(
        config.id,
        options,
      );
      await this.bulkImportRunItemRepository.deleteAllByRunIds(deletedRunIds, options);
    }
    await this.bulkImportConfigRepository.deleteAllByTemplateId(templateId, options);
  }

  private async loadAndCheckOwnership(
    id: string,
    organizationId: string,
  ): Promise<BulkImportConfig> {
    const config = await this.bulkImportConfigRepository.findOneOrFail(id);
    if (config.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    return config;
  }

  private async checkTemplateOwnership(templateId: string, organizationId: string): Promise<void> {
    const template = await this.templateRepository.findOneOrFail(templateId);
    if (template.getOrganizationId() !== organizationId) {
      throw new ForbiddenException();
    }
  }

  private async assertConfigIsEditable(configId: string): Promise<void> {
    const activeRuns = await this.getActiveRunsForConfig(configId);
    if (activeRuns.length > 0) {
      throw new ValueError("Cannot edit config while imports are pending or running");
    }
  }

  private async getActiveRunsForConfig(configId: string): Promise<BulkImportRun[]> {
    const result = await this.bulkImportRunRepository.findAllByBulkImportConfigId(configId, {
      pagination: Pagination.create({ limit: undefined }),
      filter: { status: [BulkImportRunStatusDto.Pending, BulkImportRunStatusDto.Running] },
    });
    return result.items;
  }
}

function toTransformerMap(mappings: SubmodelFieldMappingInput[]): Map<string, JsonTransformer> {
  return new Map(
    mappings.map((mapping) => [
      mapping.submodelIdShort,
      JsonTransformer.create({
        fieldMappings: mapping.fieldMappings.map((fieldMapping) =>
          FieldMapping.create(fieldMapping),
        ),
      }),
    ]),
  );
}
