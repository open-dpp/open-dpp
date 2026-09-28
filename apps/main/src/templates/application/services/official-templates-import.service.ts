import { Injectable, Logger } from "@nestjs/common";
import { AasSerializationService } from "../../../aas/infrastructure/serialization/aas-serialization.service";
import { OfficialTemplateRepository } from "../../infrastructure/official-template.repository";
import { TemplateRepository } from "../../infrastructure/template.repository";

export interface OfficialTemplateImportSuccess {
  fileName: string;
  templateId: string;
}

export interface OfficialTemplateImportFailure {
  fileName: string;
  reason: string;
}

export interface OfficialTemplatesImportResult {
  imported: OfficialTemplateImportSuccess[];
  failed: OfficialTemplateImportFailure[];
}

@Injectable()
export class OfficialTemplatesImportService {
  private readonly logger = new Logger(OfficialTemplatesImportService.name);

  constructor(
    private readonly officialTemplateRepository: OfficialTemplateRepository,
    private readonly aasSerializationService: AasSerializationService,
    private readonly templateRepository: TemplateRepository,
  ) {}

  async importOfficialTemplates(organizationId: string): Promise<OfficialTemplatesImportResult> {
    const result: OfficialTemplatesImportResult = { imported: [], failed: [] };

    let fileNames: string[];
    try {
      fileNames = await this.officialTemplateRepository.listTemplateFileNames();
    } catch (error) {
      this.logger.error(
        `Failed to list official templates from source repository for organization ${organizationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      result.failed.push({
        fileName: "*",
        reason: "Could not reach the official templates repository.",
      });
      return result;
    }

    for (const fileName of fileNames) {
      try {
        const data = await this.officialTemplateRepository.fetchTemplateFile(fileName);
        const template = await this.aasSerializationService.importTemplate(
          data,
          organizationId,
          async (t, options) => {
            await this.templateRepository.save(t, options);
          },
        );
        result.imported.push({ fileName, templateId: template.id });
      } catch (error) {
        this.logger.error(
          `Failed to import official template "${fileName}" for organization ${organizationId}`,
          error instanceof Error ? error.stack : String(error),
        );
        result.failed.push({
          fileName,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  }
}
