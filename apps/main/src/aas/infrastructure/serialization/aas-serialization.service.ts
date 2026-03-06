import type { AasExportSchema } from "./aas-export-v1.schema";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { KeyTypes } from "@open-dpp/dto";
import { z } from "zod/v4";
import { DbSessionOptions } from "../../../database/query-options";
import { MediaService } from "../../../media/infrastructure/media.service";
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
import { aasExportSchemaJsonV1_0 } from "./aas-export-v1.schema";
import { mapAssetAdministrationShells, mapConceptDescriptions, mapSubmodels } from "./aas-import.mapper";
import { extractMediaIds } from "./extract-media-ids";

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
  ): Promise<Passport> {
    try {
      const { shells, submodels, conceptDescriptions } = this.parseAndMapEnvironment(data);

      const { shells: sanitizedShells, submodels: sanitizedSubmodels }
        = await this.nullifyForeignMedia(shells, submodels, organizationId);

      const environment = Environment.create({
        assetAdministrationShells: sanitizedShells.map(aas => aas.id),
        submodels: sanitizedSubmodels.map(s => s.id),
        conceptDescriptions: conceptDescriptions.map(cd => cd.id),
      });

      const passport = Passport.create({
        organizationId,
        environment,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.environmentService.persistImportedEnvironment(
        sanitizedShells,
        sanitizedSubmodels,
        conceptDescriptions,
        async (options) => { await savePassport(passport, options); },
      );

      return passport;
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`,
        );
        throw new BadRequestException(
          `Invalid import data format: ${details.join("; ")}`,
        );
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

      const { shells: sanitizedShells, submodels: sanitizedSubmodels }
        = await this.nullifyForeignMedia(shells, submodels, organizationId);

      const environment = Environment.create({
        assetAdministrationShells: sanitizedShells.map(aas => aas.id),
        submodels: sanitizedSubmodels.map(s => s.id),
        conceptDescriptions: conceptDescriptions.map(cd => cd.id),
      });

      const template = Template.create({
        organizationId,
        environment,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.environmentService.persistImportedEnvironment(
        sanitizedShells,
        sanitizedSubmodels,
        conceptDescriptions,
        async (options) => { await saveTemplate(template, options); },
      );

      return template;
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`,
        );
        throw new BadRequestException(
          `Invalid import data format: ${details.join("; ")}`,
        );
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
      foundMedia
        .filter(m => m.ownedByOrganizationId !== organizationId)
        .map(m => m.id),
    );

    if (foreignMediaIds.size === 0) {
      return { shells, submodels };
    }

    const sanitizedShells = shells.map(shell =>
      shell.withAssetInformation(
        shell.assetInformation.withDefaultThumbnails(
          shell.assetInformation.defaultThumbnails.filter(
            t => !foreignMediaIds.has(t.path),
          ),
        ),
      ),
    );

    const sanitizedSubmodels = submodels.map(submodel => {
      const plain = submodel.toPlain();
      return Submodel.fromPlain({
        ...plain,
        submodelElements: this.withNullifiedForeignFileValues(plain.submodelElements, foreignMediaIds),
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

      if (element.modelType === KeyTypes.File
        && typeof element.value === "string"
        && foreignMediaIds.has(element.value)) {
        result = { ...element, value: null };
      }

      if (Array.isArray(element.value)) {
        const newValue = this.withNullifiedForeignFileValues(element.value, foreignMediaIds);
        result = result === element
          ? { ...element, value: newValue }
          : { ...result, value: newValue };
      }

      return result;
    });
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
