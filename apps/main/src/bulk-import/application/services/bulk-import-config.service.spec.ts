import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { BulkImportRunStatusDto } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { DbSessionOptions } from "../../../database/query-options";
import { Pagination } from "../../../pagination/pagination";
import { Template } from "../../../templates/domain/template";
import { BulkImportConfig } from "../../domain/bulk-import-config";
import { BulkImportRun } from "../../domain/bulk-import-run";
import { BulkImportConfigService } from "./bulk-import-config.service";
import { PagingResult } from "../../../pagination/paging-result";

describe("BulkImportConfigService", () => {
  function buildFakes() {
    const configRepository = {
      save: jest.fn<
        (config: BulkImportConfig, options?: DbSessionOptions) => Promise<BulkImportConfig>
      >(),
      findOneOrFail: jest.fn<(id: string) => Promise<BulkImportConfig>>(),
      findAllByOrganizationId:
        jest.fn<
          (organizationId: string, filter?: { templateId?: string }) => Promise<BulkImportConfig[]>
        >(),
      findAllByTemplateId: jest.fn<(templateId: string) => Promise<BulkImportConfig[]>>(),
      deleteById: jest.fn<(id: string, options?: DbSessionOptions) => Promise<void>>(),
      deleteAllByTemplateId:
        jest.fn<(templateId: string, options?: DbSessionOptions) => Promise<void>>(),
    };
    const runRepository = {
      deleteAllByBulkImportConfigId:
        jest.fn<(bulkImportConfigId: string, options?: DbSessionOptions) => Promise<string[]>>(),
      findAllByBulkImportConfigId:
        jest.fn<
          (
            bulkImportConfigId: string,
            options?: { pagination?: Pagination; filter?: { status?: string[] } },
          ) => Promise<PagingResult<BulkImportRun>>
        >(),
    };
    const runItemRepository = {
      deleteAllByRunIds: jest.fn<(runIds: string[], options?: DbSessionOptions) => Promise<void>>(),
    };
    const templateRepository = {
      findOneOrFail: jest.fn<(id: string) => Promise<Template>>(),
    };
    // No real Mongo session in these unit tests; just run the work directly.
    const transactionService = {
      withTransaction: jest.fn<<T>(work: (options: DbSessionOptions) => Promise<T>) => Promise<T>>(
        async (work) => await work({}),
      ),
    };

    const service = new BulkImportConfigService(
      configRepository as any,
      runRepository as any,
      runItemRepository as any,
      templateRepository as any,
      transactionService as any,
    );

    return {
      service,
      configRepository,
      runRepository,
      runItemRepository,
      templateRepository,
      transactionService,
    };
  }

  const fieldMappingInput = {
    submodelIdShort: "Nameplate",
    fieldMappings: [{ input: "sku", output: "sku" }],
  };

  it("createConfig rejects a template from another organization", async () => {
    const { service, templateRepository } = buildFakes();
    templateRepository.findOneOrFail.mockResolvedValue({
      getOrganizationId: () => "other-org",
    } as Template);

    await expect(
      service.createConfig({
        organizationId: "my-org",
        templateId: randomUUID(),
        name: "config",
        idField: "sku",
        submodelMappings: [fieldMappingInput],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("createConfig saves a config scoped to the owning organization's template", async () => {
    const { service, configRepository, templateRepository } = buildFakes();
    templateRepository.findOneOrFail.mockResolvedValue({
      getOrganizationId: () => "my-org",
    } as Template);
    configRepository.save.mockImplementation(async (config: BulkImportConfig) => config);

    const config = await service.createConfig({
      organizationId: "my-org",
      templateId: randomUUID(),
      name: "config",
      idField: "sku",
      submodelMappings: [fieldMappingInput],
    });

    expect(config.name).toEqual("config");
    expect(config.organizationId).toEqual("my-org");
    expect(configRepository.save).toHaveBeenCalledWith(config);
  });

  it("deleteAllByTemplateId cascades across every config targeting the template", async () => {
    const { service, configRepository, runRepository, runItemRepository } = buildFakes();
    const c1 = BulkImportConfig.create({
      organizationId: "org",
      templateId: "template-1",
      name: "a",
      idField: "sku",
    });
    const c2 = BulkImportConfig.create({
      organizationId: "org",
      templateId: "template-1",
      name: "b",
      idField: "sku",
    });
    configRepository.findAllByTemplateId.mockResolvedValue([c1, c2]);
    runRepository.deleteAllByBulkImportConfigId.mockImplementation(async (id: string) => [
      `run-of-${id}`,
    ]);

    await service.deleteAllByTemplateId("template-1");

    expect(runRepository.deleteAllByBulkImportConfigId).toHaveBeenCalledWith(c1.id, undefined);
    expect(runRepository.deleteAllByBulkImportConfigId).toHaveBeenCalledWith(c2.id, undefined);
    expect(runItemRepository.deleteAllByRunIds).toHaveBeenCalledWith(
      [`run-of-${c1.id}`],
      undefined,
    );
    expect(runItemRepository.deleteAllByRunIds).toHaveBeenCalledWith(
      [`run-of-${c2.id}`],
      undefined,
    );
    expect(configRepository.deleteAllByTemplateId).toHaveBeenCalledWith("template-1", undefined);
  });

  describe("edit validation", () => {
    it("updateConfig rejects edit when config has active runs", async () => {
      const { service, configRepository, runRepository } = buildFakes();
      const config = BulkImportConfig.create({
        organizationId: "my-org",
        templateId: randomUUID(),
        name: "config",
        idField: "sku",
      });
      configRepository.findOneOrFail.mockResolvedValue(config);
      runRepository.findAllByBulkImportConfigId.mockResolvedValue(
        PagingResult.create({
          pagination: Pagination.create({}),
          items: [
            { id: "run-1", status: BulkImportRunStatusDto.Pending } as BulkImportRun,
            { id: "run-2", status: BulkImportRunStatusDto.Running } as BulkImportRun,
          ],
        }),
      );

      await expect(service.updateConfig(config.id, "my-org", { name: "renamed" })).rejects.toThrow(
        ValueError,
      );
      expect(configRepository.save).not.toHaveBeenCalled();
    });

    it("updateConfig allows edit when config has no active runs", async () => {
      const { service, configRepository, runRepository } = buildFakes();
      const config = BulkImportConfig.create({
        organizationId: "my-org",
        templateId: randomUUID(),
        name: "config",
        idField: "sku",
      });
      configRepository.findOneOrFail.mockResolvedValue(config);
      configRepository.save.mockImplementation(async (c: BulkImportConfig) => c);
      runRepository.findAllByBulkImportConfigId.mockResolvedValue(
        PagingResult.create({ pagination: Pagination.create({}), items: [] }),
      );

      const updated = await service.updateConfig(config.id, "my-org", { name: "renamed" });
      expect(updated.name).toEqual("renamed");
      expect(configRepository.save).toHaveBeenCalledWith(config);
    });

    it("updateConfig rejects a config from another organization", async () => {
      const { service, configRepository } = buildFakes();
      const config = BulkImportConfig.create({
        organizationId: "other-org",
        templateId: randomUUID(),
        name: "config",
        idField: "sku",
      });
      configRepository.findOneOrFail.mockResolvedValue(config);

      await expect(service.updateConfig(config.id, "my-org", { name: "renamed" })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("deleteConfig rejects deletion when config has active runs", async () => {
      const { service, configRepository, runRepository, transactionService } = buildFakes();
      const config = BulkImportConfig.create({
        organizationId: "my-org",
        templateId: randomUUID(),
        name: "config",
        idField: "sku",
      });
      configRepository.findOneOrFail.mockResolvedValue(config);
      runRepository.findAllByBulkImportConfigId.mockResolvedValue(
        PagingResult.create({
          pagination: Pagination.create({}),
          items: [{ id: "run-1", status: BulkImportRunStatusDto.Pending } as BulkImportRun],
        }),
      );

      await expect(service.deleteConfig(config.id, "my-org")).rejects.toThrow(ValueError);
      expect(transactionService.withTransaction).not.toHaveBeenCalled();
      expect(runRepository.deleteAllByBulkImportConfigId).not.toHaveBeenCalled();
      expect(configRepository.deleteById).not.toHaveBeenCalled();
    });

    it("deleteConfig rejects a config from another organization without deleting anything", async () => {
      const { service, configRepository, runRepository, transactionService } = buildFakes();
      const config = BulkImportConfig.create({
        organizationId: "other-org",
        templateId: randomUUID(),
        name: "config",
        idField: "sku",
      });
      configRepository.findOneOrFail.mockResolvedValue(config);

      await expect(service.deleteConfig(config.id, "my-org")).rejects.toThrow(ForbiddenException);
      expect(transactionService.withTransaction).not.toHaveBeenCalled();
      expect(runRepository.deleteAllByBulkImportConfigId).not.toHaveBeenCalled();
      expect(configRepository.deleteById).not.toHaveBeenCalled();
    });

    it("deleteConfig allows deletion when config has no active runs", async () => {
      const { service, configRepository, runRepository, runItemRepository, transactionService } =
        buildFakes();
      const config = BulkImportConfig.create({
        organizationId: "my-org",
        templateId: randomUUID(),
        name: "config",
        idField: "sku",
      });
      configRepository.findOneOrFail.mockResolvedValue(config);
      runRepository.findAllByBulkImportConfigId.mockResolvedValue(
        PagingResult.create({ pagination: Pagination.create({}), items: [] }),
      );
      runRepository.deleteAllByBulkImportConfigId.mockResolvedValue(["run-1", "run-2"]);

      await service.deleteConfig(config.id, "my-org");

      expect(transactionService.withTransaction).toHaveBeenCalledTimes(1);
      expect(runRepository.deleteAllByBulkImportConfigId).toHaveBeenCalledWith(config.id, {});
      expect(runItemRepository.deleteAllByRunIds).toHaveBeenCalledWith(["run-1", "run-2"], {});
      expect(configRepository.deleteById).toHaveBeenCalledWith(config.id, {});
    });
  });
});
