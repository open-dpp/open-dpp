import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { KeyTypes, PresentationReferenceType } from "@open-dpp/dto";
import { PresentationReferenceHolder } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { z } from "zod/v4";
import { DbSessionOptions } from "../../../database/query-options";
import { MediaService } from "../../../media/infrastructure/media.service";
import { Passport } from "../../../passports/domain/passport";
import { PresentationConfigurationService } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { Template } from "../../../templates/domain/template";
import { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import { ConceptDescription } from "../../domain/concept-description";
import { Environment } from "../../domain/environment";
import { AasExportable } from "../../domain/exportable/aas-exportable";
import { SubjectAttributes } from "../../domain/security/subject-attributes";
import { Submodel } from "../../domain/submodel-base/submodel";
import { EnvironmentService } from "../../presentation/environment.service";
import {
  mapAssetAdministrationShells,
  mapConceptDescriptions,
  mapPresentationConfiguration,
  mapSubmodels,
} from "./aas-import.mapper";
import { AasExportVersion } from "./export-schemas/aas-export-shared";
import {
  AasExport,
  AasExportLatestVersion,
  aasExportSchemaJsonLatest,
} from "./export-schemas/aas-export-types";
import { extractMediaIds } from "./extract-media-ids";
import { ParseWithMigration } from "./export-schemas/aas-export-migration";

export {
  DataTypeDefV1_0,
  KeyTypesV1_0,
  LanguageTypeSchemaV1_0,
} from "./export-schemas/aas-export-v1.schema";

interface ImportedEnvironmentData {
  shells: AssetAdministrationShell[];
  submodels: Submodel[];
  conceptDescriptions: ConceptDescription[];
  schema: AasExportLatestVersion;
}

@Injectable()
export class AasSerializationService {
  private readonly logger = new Logger(AasSerializationService.name);

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly mediaService: MediaService,
    private readonly presentationConfigurationService: PresentationConfigurationService,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
  ) {}

  async exportPassport(
    passport: Passport,
    subject: SubjectAttributes,
  ): Promise<AasExportLatestVersion> {
    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(
      passport.environment,
    );
    const presentationConfiguration = await this.presentationConfigurationService.getEffective(
      passportToHolder(passport),
    );
    const aasExportable = AasExportable.createFromPassport(
      passport,
      expandedEnvironment,
      presentationConfiguration,
    );
    return aasExportSchemaJsonLatest.parse(aasExportable.toExportPlain(subject));
  }

  async exportTemplate(
    template: Template,
    subject: SubjectAttributes,
  ): Promise<AasExportLatestVersion> {
    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(
      template.environment,
    );
    const presentationConfiguration = await this.presentationConfigurationService.getEffective(
      templateToHolder(template),
    );
    const aasExportable = AasExportable.createFromTemplate(
      template,
      expandedEnvironment,
      presentationConfiguration,
    );

    const aasExportablePlain = aasExportable.toExportPlain(subject);

    return aasExportSchemaJsonLatest.parse(aasExportablePlain);
  }

  async importPassport(
    data: any,
    organizationId: string,
    savePassport: (passport: Passport, options: DbSessionOptions) => Promise<void>,
    afterPersist?: (passport: Passport, options: DbSessionOptions) => Promise<void>,
  ): Promise<Passport> {
    return this.importEntity(
      data,
      organizationId,
      (environment) =>
        Passport.create({
          organizationId,
          environment,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      PresentationReferenceType.Passport,
      savePassport,
      afterPersist,
    );
  }

  async importTemplate(
    data: any,
    organizationId: string,
    saveTemplate: (template: Template, options: DbSessionOptions) => Promise<void>,
    afterPersist?: (template: Template, options: DbSessionOptions) => Promise<void>,
  ): Promise<Template> {
    return this.importEntity(
      data,
      organizationId,
      (environment) =>
        Template.create({
          organizationId,
          environment,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      PresentationReferenceType.Template,
      saveTemplate,
      afterPersist,
    );
  }

  private async importEntity<T extends { id: string }>(
    data: unknown,
    organizationId: string,
    entityFactory: (environment: Environment) => T,
    referenceType: (typeof PresentationReferenceType)[keyof typeof PresentationReferenceType],
    saveEntity: (entity: T, options: DbSessionOptions) => Promise<void>,
    afterPersist?: (entity: T, options: DbSessionOptions) => Promise<void>,
  ): Promise<T> {
    try {
      const { shells, submodels, conceptDescriptions, schema } = this.parseAndMapEnvironment(data);

      const { shells: sanitizedShells, submodels: sanitizedSubmodels } =
        await this.nullifyForeignMedia(shells, submodels, organizationId);

      const environment = Environment.create({
        assetAdministrationShells: sanitizedShells.map((aas) => aas.id),
        submodels: sanitizedSubmodels.map((s) => s.id),
        conceptDescriptions: conceptDescriptions.map((cd) => cd.id),
      });

      const entity = entityFactory(environment);

      const presentationConfiguration = mapPresentationConfiguration({
        schema,
        organizationId,
        referenceId: entity.id,
        referenceType,
      });

      await this.environmentService.persistImportedEnvironment(
        sanitizedShells,
        sanitizedSubmodels,
        conceptDescriptions,
        async (options) => {
          await saveEntity(entity, options);
          if (presentationConfiguration) {
            await this.presentationConfigurationRepository.save(presentationConfiguration, options);
          }
          if (afterPersist) {
            await afterPersist(entity, options);
          }
        },
      );

      return entity;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("error of zod", error);
        const details = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
        throw new BadRequestException(`Invalid import data format: ${details.join("; ")}`);
      }
      this.logger.error(
        `Failed to import ${referenceType} for organization ${organizationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async nullifyForeignMedia(
    shells: AssetAdministrationShell[],
    submodels: Submodel[],
    organizationId: string,
  ): Promise<{ shells: AssetAdministrationShell[]; submodels: Submodel[] }> {
    const mediaIds = extractMediaIds(shells, submodels);
    if (mediaIds.length === 0) {
      return { shells, submodels };
    }

    const foundMedia = await this.mediaService.findByIds(mediaIds);
    const foreignMediaIds = new Set(
      foundMedia.filter((m) => m.ownedByOrganizationId !== organizationId).map((m) => m.id),
    );
    for (const mediaId of mediaIds) {
      if (!foreignMediaIds.has(mediaId) && !foundMedia.find((m) => m.id === mediaId)) {
        foreignMediaIds.add(mediaId);
      }
    }

    if (foreignMediaIds.size === 0) {
      return { shells, submodels };
    }

    const sanitizedShells = shells.map((shell) =>
      shell.withAssetInformation(
        shell.assetInformation.withDefaultThumbnails(
          shell.assetInformation.defaultThumbnails.filter((t) => !foreignMediaIds.has(t.path)),
        ),
      ),
    );

    const sanitizedSubmodels = submodels.map((submodel) => {
      const plain = submodel.toPlain();
      return Submodel.fromPlain({
        ...plain,
        submodelElements: this.withNullifiedForeignFileValues(
          plain.submodelElements,
          foreignMediaIds,
        ),
      });
    });

    return { shells: sanitizedShells, submodels: sanitizedSubmodels };
  }

  private withNullifiedForeignFileValues(
    elements: Record<string, any>[],
    foreignMediaIds: Set<string>,
  ): Record<string, any>[] {
    return elements.map((element) => {
      let result = element;

      if (
        element.modelType === KeyTypes.File &&
        typeof element.value === "string" &&
        foreignMediaIds.has(element.value)
      ) {
        result = { ...element, value: null };
      } else if (Array.isArray(element.value)) {
        const newValue = this.withNullifiedForeignFileValues(element.value, foreignMediaIds);
        result = { ...element, value: newValue };
      }

      return result;
    });
  }

  private parseAndMapEnvironment(data: unknown): ImportedEnvironmentData {
    const schema = ParseWithMigration(data);

    const { submodels, idMapping } = mapSubmodels(schema.environment.submodels, schema.version);

    return {
      shells: mapAssetAdministrationShells(
        schema.environment.assetAdministrationShells,
        idMapping,
        submodels,
        schema.version,
      ),
      submodels,
      conceptDescriptions: mapConceptDescriptions(schema.environment.conceptDescriptions),
      schema,
    };
  }
}

function passportToHolder(passport: Passport): PresentationReferenceHolder {
  return {
    id: passport.id,
    organizationId: passport.organizationId,
    referenceType: PresentationReferenceType.Passport,
  };
}

function templateToHolder(template: Template): PresentationReferenceHolder {
  return {
    id: template.id,
    organizationId: template.organizationId,
    referenceType: PresentationReferenceType.Template,
  };
}
