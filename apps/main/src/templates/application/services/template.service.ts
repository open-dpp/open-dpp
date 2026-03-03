import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ValueError } from "@open-dpp/exception";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { ExpandedTemplatePlain, Template } from "../../domain/template";
import { TemplateRepository } from "../../infrastructure/template.repository";

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly environmentService: EnvironmentService,
  ) {}

  async exportTemplate(templateId: string): Promise<ExpandedTemplatePlain> {
    const template = await this.templateRepository.findOneOrFail(templateId);
    return template.toExportPlain();
  }

  async importTemplate(data: {
    organizationId: string;
    environment: unknown;
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<Template> {
    if (!data.organizationId) {
      throw new BadRequestException("organizationId is required");
    }

    let result: ReturnType<typeof Template.importFromPlain>;
    try {
      result = Template.importFromPlain(data as ExpandedTemplatePlain, data.organizationId);
    }
    catch (err) {
      if (err instanceof ValueError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const { entity, shells, submodels } = result;

    await this.environmentService.persistImportedEnvironment(
      shells,
      submodels,
      async (options) => { await this.templateRepository.save(entity, options); },
    );

    return entity;
  }
}
