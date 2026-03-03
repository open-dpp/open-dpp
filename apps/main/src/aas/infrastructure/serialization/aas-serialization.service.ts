import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { z } from "zod/v4";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { PassportService } from "../../../passports/application/services/passport.service";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { TemplateRepository } from "../../../templates/infrastructure/template.repository";
import { Environment } from "../../domain/environment";
import { AasExportable } from "../../domain/exportable/aas-exportable";

const AasExportFormat = {
  "open-dpp:json": "open-dpp:json",
} as const;
const AasExportVersion = {
  "1.0": "1.0",
} as const;

const aasExportSchemaV1_0 = z.object({
  id: z.string(),
  environment: z.object({
    shells: z.array(z.object()),
    submodels: z.array(z.object()),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  format: AasExportFormat["open-dpp:json"],
  version: AasExportVersion["1.0"],
});

type AasExportSchema = z.infer<typeof aasExportSchemaV1_0>;

@Injectable()
export class AasSerializationService {
  private readonly logger = new Logger(AasSerializationService.name);

  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly passportService: PassportService,
    private readonly environmentService: EnvironmentService,
  ) {}

  async exportPassport(passportId: string): Promise<AasExportSchema> {
    const aasExportable = await this.passportService.getExpandedProductPassport(passportId);
    return aasExportSchemaV1_0.parse(aasExportable);
  }

  async exportTemplate(templateId: string): Promise<AasExportSchema> {
    const template = await this.templateRepository.findOneOrFail(templateId);
    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(template.environment);
    const aasExportable = AasExportable.createFromTemplate(template, expandedEnvironment);
    return aasExportSchemaV1_0.parse(aasExportable);
  }

  async importPassport(data: any, organizationId: string): Promise<Passport | null> {
    try {
      const aasExportableSchema = aasExportSchemaV1_0.parse(data);
      const environment = Environment.fromPlain(aasExportableSchema.environment);
      const passport = Passport.create({
        organizationId,
        environment,
        createdAt: aasExportableSchema.createdAt,
        updatedAt: aasExportableSchema.updatedAt,
      });
      /* await this.environmentService.persistImportedEnvironment(
        shells,
        submodels,
        async (options) => { await this.templateRepository.save(entity, options); },
      ); */
      return passport;
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException();
      }
    }
    return null;
  }

  async importTemplate(data: any, organizationId: string): Promise<Template | null> {
    try {
      const aasExportableSchema = aasExportSchemaV1_0.parse(data);
      const environment = Environment.fromPlain(aasExportableSchema.environment);
      const template = Template.create({
        organizationId,
        environment,
        createdAt: aasExportableSchema.createdAt,
        updatedAt: aasExportableSchema.updatedAt,
      });
      /* await this.environmentService.persistImportedEnvironment(
        shells,
        submodels,
        async (options) => { await this.templateRepository.save(entity, options); },
      ); */
      return template;
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException();
      }
    }
    return null;
  }
}
