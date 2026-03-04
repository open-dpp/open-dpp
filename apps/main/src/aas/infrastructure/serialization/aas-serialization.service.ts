import type { AasExportSchema } from "./aas-export-v1.schema";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { z } from "zod/v4";
import { DbSessionOptions } from "../../../database/query-options";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import { ConceptDescription } from "../../domain/concept-description";
import { Environment } from "../../domain/environment";
import { AasExportable } from "../../domain/exportable/aas-exportable";
import { Submodel } from "../../domain/submodel-base/submodel";
import { EnvironmentService } from "../../presentation/environment.service";
import { AasRepository } from "../aas.repository";
import { ConceptDescriptionRepository } from "../concept-description.repository";
import { SubmodelRepository } from "../submodel.repository";
import { MediaService } from "../../../media/infrastructure/media.service";
import { aasExportSchemaJsonV1_0 } from "./aas-export-v1.schema";
import { extractMediaIds } from "./extract-media-ids";
import { mapAssetAdministrationShells, mapConceptDescriptions, mapSubmodels } from "./aas-import.mapper";

export { DataTypeDefV1_0, KeyTypesV1_0, LanguageTypeSchemaV1_0 } from "./aas-export-v1.schema";

interface ImportedEnvironmentData {
  shells: AssetAdministrationShell[];
  submodels: Submodel[];
  conceptDescriptions: ConceptDescription[];
  schema: AasExportSchema;
}

@Injectable()
export class AasSerializationService {
  private readonly logger = new Logger(AasSerializationService.name);

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly aasRepository: AasRepository,
    private readonly submodelRepository: SubmodelRepository,
    private readonly conceptDescriptionRepository: ConceptDescriptionRepository,
    private readonly mediaService: MediaService,
  ) {}

  async exportPassport(passport: Passport): Promise<AasExportSchema> {
    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(passport.environment);
    const aasExportable = AasExportable.createFromPassport(passport, expandedEnvironment);
    return aasExportSchemaJsonV1_0.parse(aasExportable.toExportPlain());
  }

  async exportTemplate(template: Template): Promise<AasExportSchema> {
    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(template.environment);
    const aasExportable = AasExportable.createFromTemplate(template, expandedEnvironment);
    return aasExportSchemaJsonV1_0.parse(aasExportable.toExportPlain());
  }

  async importPassport(
    data: any,
    organizationId: string,
    savePassport: (passport: Passport, options: DbSessionOptions) => Promise<void>,
  ): Promise<Passport | null> {
    try {
      const { shells, submodels, conceptDescriptions } = this.parseAndMapEnvironment(data);

      await this.validateMediaOwnership(shells, submodels, organizationId);

      const environment = Environment.create({
        assetAdministrationShells: shells.map(aas => aas.id),
        submodels: submodels.map(s => s.id),
        conceptDescriptions: conceptDescriptions.map(cd => cd.id),
      });

      const passport = Passport.create({
        organizationId,
        environment,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.environmentService.persistImportedEnvironment(
        shells,
        submodels,
        conceptDescriptions,
        async (options) => { await savePassport(passport, options); },
      );

      return passport;
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        console.error(error);
        throw new BadRequestException("Invalid import data format");
      }
      throw error;
    }
  }

  async importTemplate(
    data: any,
    organizationId: string,
    saveTemplate: (template: Template, options: DbSessionOptions) => Promise<void>,
  ): Promise<Template> {
    try {
      const { shells, submodels, conceptDescriptions, schema } = this.parseAndMapEnvironment(data);

      await this.validateMediaOwnership(shells, submodels, organizationId);

      const environment = Environment.create({
        assetAdministrationShells: shells.map(aas => aas.id),
        submodels: submodels.map(s => s.id),
        conceptDescriptions: conceptDescriptions.map(cd => cd.id),
      });

      const template = Template.create({
        organizationId,
        environment,
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
      });

      await this.environmentService.persistImportedEnvironment(
        shells,
        submodels,
        conceptDescriptions,
        async (options) => { await saveTemplate(template, options); },
      );

      return template;
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException("Invalid import data format");
      }
      throw error;
    }
  }

  private async validateMediaOwnership(
    shells: AssetAdministrationShell[],
    submodels: Submodel[],
    organizationId: string,
  ): Promise<void> {
    const mediaIds = extractMediaIds(shells, submodels);
    if (mediaIds.length === 0) {
      return;
    }

    const foundMedia = await this.mediaService.findByIds(mediaIds);
    const foreignMedia = foundMedia.filter(
      m => m.ownedByOrganizationId !== organizationId,
    );

    if (foreignMedia.length > 0) {
      throw new BadRequestException(
        "Import contains media references belonging to a different organization",
      );
    }
  }

  private parseAndMapEnvironment(data: unknown): ImportedEnvironmentData {
    const schema = aasExportSchemaJsonV1_0.parse(data);
    return {
      shells: mapAssetAdministrationShells(schema.environment.assetAdministrationShells),
      submodels: mapSubmodels(schema.environment.submodels),
      conceptDescriptions: mapConceptDescriptions(schema.environment.conceptDescriptions),
      schema,
    };
  }
}
