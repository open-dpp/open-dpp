import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { KeyTypes, PresentationReferenceType } from "@open-dpp/dto";
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
  mapSubmodels,
} from "./aas-import.mapper";
import {
  AasExport,
  AasExportLatestVersion,
  aasExportSchemaJsonLatest,
  AasExportSchemas,
} from "./export-schemas/aas-export-types";
import { extractMediaIds } from "./extract-media-ids";

export {
  DataTypeDefV1_0,
  KeyTypesV1_0,
  LanguageTypeSchemaV1_0,
} from "./export-schemas/aas-export-v1.schema";

interface ImportedEnvironmentData {
  shells: AssetAdministrationShell[];
  submodels: Submodel[];
  conceptDescriptions: ConceptDescription[];
  schema: AasExport;
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
    const presentationConfiguration =
      await this.presentationConfigurationService.getOrCreateForPassport(passport);
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
    const presentationConfiguration =
      await this.presentationConfigurationService.getOrCreateForTemplate(template);
    const aasExportable = AasExportable.createFromTemplate(
      template,
      expandedEnvironment,
      presentationConfiguration,
    );
    return aasExportSchemaJsonLatest.parse(aasExportable.toExportPlain(subject));
  }

  async importPassport(
    data: any,
    organizationId: string,
    savePassport: (passport: Passport, options: DbSessionOptions) => Promise<void>,
  ): Promise<Passport> {
    try {
      const { shells, submodels, conceptDescriptions, schema } = this.parseAndMapEnvironment(data);

      const { shells: sanitizedShells, submodels: sanitizedSubmodels } =
        await this.nullifyForeignMedia(shells, submodels, organizationId);

      const environment = Environment.create({
        assetAdministrationShells: sanitizedShells.map((aas) => aas.id),
        submodels: sanitizedSubmodels.map((s) => s.id),
        conceptDescriptions: conceptDescriptions.map((cd) => cd.id),
      });

      const passport = Passport.create({
        organizationId,
        environment,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const presentationConfiguration = buildImportedPresentationConfiguration({
        schema,
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
      });

      await this.environmentService.persistImportedEnvironment(
        sanitizedShells,
        sanitizedSubmodels,
        conceptDescriptions,
        async (options) => {
          await savePassport(passport, options);
          if (presentationConfiguration) {
            await this.presentationConfigurationRepository.save(
              presentationConfiguration,
              options,
            );
          }
        },
      );

      return passport;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
        throw new BadRequestException(`Invalid import data format: ${details.join("; ")}`);
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

      const { shells: sanitizedShells, submodels: sanitizedSubmodels } =
        await this.nullifyForeignMedia(shells, submodels, organizationId);

      const environment = Environment.create({
        assetAdministrationShells: sanitizedShells.map((aas) => aas.id),
        submodels: sanitizedSubmodels.map((s) => s.id),
        conceptDescriptions: conceptDescriptions.map((cd) => cd.id),
      });

      const template = Template.create({
        organizationId,
        environment,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const presentationConfiguration = buildImportedPresentationConfiguration({
        schema,
        organizationId,
        referenceId: template.id,
        referenceType: PresentationReferenceType.Template,
      });

      await this.environmentService.persistImportedEnvironment(
        sanitizedShells,
        sanitizedSubmodels,
        conceptDescriptions,
        async (options) => {
          await saveTemplate(template, options);
          if (presentationConfiguration) {
            await this.presentationConfigurationRepository.save(
              presentationConfiguration,
              options,
            );
          }
        },
      );

      return template;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
        throw new BadRequestException(`Invalid import data format: ${details.join("; ")}`);
      }
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
      }

      if (Array.isArray(element.value)) {
        const newValue = this.withNullifiedForeignFileValues(element.value, foreignMediaIds);
        result =
          result === element ? { ...element, value: newValue } : { ...result, value: newValue };
      }

      return result;
    });
  }

  private parseAndMapEnvironment(data: unknown): ImportedEnvironmentData {
    const schema = AasExportSchemas.parse(data);

    const { submodels, idMapping } = mapSubmodels(schema.environment.submodels);

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

function buildImportedPresentationConfiguration(params: {
  schema: AasExport;
  organizationId: string;
  referenceId: string;
  referenceType: (typeof PresentationReferenceType)[keyof typeof PresentationReferenceType];
}): PresentationConfiguration | null {
  const { schema, organizationId, referenceId, referenceType } = params;
  if (!("presentationConfiguration" in schema) || !schema.presentationConfiguration) {
    return null;
  }
  return PresentationConfiguration.create({
    organizationId,
    referenceId,
    referenceType,
    elementDesign: schema.presentationConfiguration.elementDesign,
    defaultComponents: schema.presentationConfiguration.defaultComponents,
  });
}
