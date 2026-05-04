import { Injectable } from "@nestjs/common";
import {
  KeyTypesType,
  PresentationComponentNameType,
  PresentationConfigurationPatchDto,
  PresentationReferenceType,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { isDuplicateKeyError } from "../../../lib/mongo-errors";
import { PresentationConfiguration } from "../../domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../infrastructure/presentation-configuration.repository";

@Injectable()
export class PresentationConfigurationService {
  constructor(
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
  ) {}

  async findOrInstantiateForTemplate(template: Template): Promise<PresentationConfiguration> {
    const existing = await this.presentationConfigurationRepository.findByReference({
      referenceType: PresentationReferenceType.Template,
      referenceId: template.id,
    });
    return (
      existing ??
      PresentationConfiguration.createForTemplate({
        organizationId: template.organizationId,
        referenceId: template.id,
      })
    );
  }

  async findOrInstantiateForPassport(passport: Passport): Promise<PresentationConfiguration> {
    const existing = await this.presentationConfigurationRepository.findByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
    });
    return (
      existing ??
      PresentationConfiguration.createForPassport({
        organizationId: passport.organizationId,
        referenceId: passport.id,
      })
    );
  }

  async applyPatchForTemplate(
    template: Template,
    patch: PresentationConfigurationPatchDto,
  ): Promise<PresentationConfiguration> {
    const config = await this.findOrInstantiateForTemplate(template);
    return await this.persistPatch(config, patch);
  }

  async applyPatchForPassport(
    passport: Passport,
    patch: PresentationConfigurationPatchDto,
  ): Promise<PresentationConfiguration> {
    const config = await this.findOrInstantiateForPassport(passport);
    return await this.persistPatch(config, patch);
  }

  async getEffectiveForPassport(passport: Passport): Promise<PresentationConfiguration> {
    const passportConfig = await this.findOrInstantiateForPassport(passport);
    return this.mergeWithTemplate(passport, passportConfig);
  }

  private async mergeWithTemplate(
    passport: Passport,
    passportConfig: PresentationConfiguration,
  ): Promise<PresentationConfiguration> {
    if (!passport.templateId) return passportConfig;

    const templateConfig = await this.presentationConfigurationRepository.findByReference({
      referenceType: PresentationReferenceType.Template,
      referenceId: passport.templateId,
    });
    if (!templateConfig) return passportConfig;

    const mergedElementDesign = new Map<string, PresentationComponentNameType>([
      ...templateConfig.elementDesign,
      ...passportConfig.elementDesign,
    ]);
    const mergedDefaults = new Map<KeyTypesType, PresentationComponentNameType>([
      ...templateConfig.defaultComponents,
      ...passportConfig.defaultComponents,
    ]);

    return PresentationConfiguration.fromPlain({
      ...passportConfig.toPlain(),
      elementDesign: Object.fromEntries(mergedElementDesign),
      defaultComponents: Object.fromEntries(mergedDefaults),
    });
  }

  private async persistPatch(
    config: PresentationConfiguration,
    patch: PresentationConfigurationPatchDto,
  ): Promise<PresentationConfiguration> {
    let next = config;
    if (patch.elementDesign) {
      for (const [path, value] of Object.entries(patch.elementDesign)) {
        next =
          value === null ? next.withoutElementDesign(path) : next.withElementDesign(path, value);
      }
    }
    if (patch.defaultComponents) {
      for (const [type, value] of Object.entries(patch.defaultComponents) as [
        KeyTypesType,
        PresentationComponentNameType | null,
      ][]) {
        next =
          value === null
            ? next.withoutDefaultComponent(type)
            : next.withDefaultComponent(type, value);
      }
    }
    if (next === config) return config;
    try {
      return await this.presentationConfigurationRepository.save(next);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ValueError(
          `PresentationConfiguration for ${config.referenceType} ${config.referenceId} was created concurrently. Retry the request.`,
          { cause: error as Error },
        );
      }
      throw error;
    }
  }
}
