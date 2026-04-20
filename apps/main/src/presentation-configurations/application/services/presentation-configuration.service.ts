import { Injectable } from "@nestjs/common";
import {
  KeyTypesType,
  PresentationComponentNameType,
  PresentationConfigurationPatchDto,
  PresentationReferenceType,
} from "@open-dpp/dto";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { PresentationConfiguration } from "../../domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../infrastructure/presentation-configuration.repository";

@Injectable()
export class PresentationConfigurationService {
  constructor(
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
  ) {}

  async getOrCreateForTemplate(template: Template): Promise<PresentationConfiguration> {
    return await this.presentationConfigurationRepository.findOrCreateByReference({
      referenceType: PresentationReferenceType.Template,
      referenceId: template.id,
      organizationId: template.organizationId,
    });
  }

  async getOrCreateForPassport(passport: Passport): Promise<PresentationConfiguration> {
    return await this.presentationConfigurationRepository.findOrCreateByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
      organizationId: passport.organizationId,
    });
  }

  async applyPatchForTemplate(
    template: Template,
    patch: PresentationConfigurationPatchDto,
  ): Promise<PresentationConfiguration> {
    const config = await this.getOrCreateForTemplate(template);
    return await this.applyPatch(config, patch);
  }

  async applyPatchForPassport(
    passport: Passport,
    patch: PresentationConfigurationPatchDto,
  ): Promise<PresentationConfiguration> {
    const config = await this.getOrCreateForPassport(passport);
    return await this.applyPatch(config, patch);
  }

  async getEffectiveForPassport(passport: Passport): Promise<PresentationConfiguration> {
    const passportConfig = await this.getOrCreateForPassport(passport);
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

  private async applyPatch(
    config: PresentationConfiguration,
    patch: PresentationConfigurationPatchDto,
  ): Promise<PresentationConfiguration> {
    let next = config;
    if (patch.elementDesign) {
      for (const [path, value] of Object.entries(patch.elementDesign)) {
        next = value === null ? next.withoutElementDesign(path) : next.withElementDesign(path, value);
      }
    }
    if (patch.defaultComponents) {
      for (const [type, value] of Object.entries(patch.defaultComponents) as [
        KeyTypesType,
        PresentationComponentNameType | null,
      ][]) {
        next =
          value === null ? next.withoutDefaultComponent(type) : next.withDefaultComponent(type, value);
      }
    }
    if (next === config) return config;
    return await this.presentationConfigurationRepository.save(next);
  }
}
