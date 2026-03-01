import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ValueError } from "@open-dpp/exception";
import { ExpandedEnvironment, ExpandedEnvironmentPlain } from "../../../aas/domain/expanded-environment";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { Template } from "../../domain/template";
import { TemplateRepository } from "../../infrastructure/template.repository";

export type ExpandedTemplatePlain = Omit<ReturnType<Template["toPlain"]>, "environment"> & {
  environment: ExpandedEnvironmentPlain;
};

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly environmentService: EnvironmentService,
  ) {}

  async exportTemplate(templateId: string): Promise<ExpandedTemplatePlain> {
    const template = await this.templateRepository.findOneOrFail(templateId);

    if (!template.environment) {
      return {
        ...template.toPlain(),
        environment: ExpandedEnvironment.empty().toPlain(),
      } as ExpandedTemplatePlain;
    }

    const expandedEnv = await this.environmentService.loadExpandedEnvironment(template.environment);

    return {
      ...template.toPlain(),
      environment: expandedEnv.toPlain(),
    } as ExpandedTemplatePlain;
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

    let expandedEnv: ExpandedEnvironment;
    try {
      expandedEnv = ExpandedEnvironment.fromPlain(data.environment);
    }
    catch (err) {
      if (err instanceof ValueError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const { environment, shells, submodels } = expandedEnv.copyWithNewIds();

    const newTemplate = Template.create({
      organizationId: data.organizationId,
      environment,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    await this.environmentService.persistImportedEnvironment(
      shells,
      submodels,
      async options => { await this.templateRepository.save(newTemplate, options); },
    );

    return newTemplate;
  }
}
