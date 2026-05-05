import { Injectable } from "@nestjs/common";
import {
  KeyTypesType,
  PresentationComponentNameType,
  PresentationConfigurationPatchDto,
  PresentationReferenceType,
  PresentationReferenceTypeType,
} from "@open-dpp/dto";
import { NotFoundError } from "@open-dpp/exception";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import type { DbSessionOptions } from "../../../database/query-options";
import { PresentationConfiguration } from "../../domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../infrastructure/presentation-configuration.repository";

@Injectable()
export class PresentationConfigurationService {
  constructor(
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
  ) {}

  async listForPassport(passport: Passport): Promise<PresentationConfiguration[]> {
    return this.listOrSeed({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
      organizationId: passport.organizationId,
    });
  }

  async listForTemplate(template: Template): Promise<PresentationConfiguration[]> {
    return this.listOrSeed({
      referenceType: PresentationReferenceType.Template,
      referenceId: template.id,
      organizationId: template.organizationId,
    });
  }

  private async listOrSeed(input: {
    referenceType: PresentationReferenceTypeType;
    referenceId: string;
    organizationId: string;
  }): Promise<PresentationConfiguration[]> {
    const existing = await this.presentationConfigurationRepository.findManyByReference({
      referenceType: input.referenceType,
      referenceId: input.referenceId,
    });
    if (existing.length > 0) return existing;
    const seeded = PresentationConfiguration.create({
      organizationId: input.organizationId,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      label: null,
    });
    const saved = await this.presentationConfigurationRepository.save(seeded);
    return [saved];
  }

  async getByIdForPassport(
    passport: Passport,
    configId: string,
  ): Promise<PresentationConfiguration> {
    return this.requireOwned(configId, {
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
    });
  }

  async getByIdForTemplate(
    template: Template,
    configId: string,
  ): Promise<PresentationConfiguration> {
    return this.requireOwned(configId, {
      referenceType: PresentationReferenceType.Template,
      referenceId: template.id,
    });
  }

  private async requireOwned(
    configId: string,
    ref: { referenceType: PresentationReferenceTypeType; referenceId: string },
  ): Promise<PresentationConfiguration> {
    const config = await this.presentationConfigurationRepository.findOneOrFail(configId);
    if (config.referenceType !== ref.referenceType || config.referenceId !== ref.referenceId) {
      throw new NotFoundError(`PresentationConfiguration ${configId} not found for reference`);
    }
    return config;
  }

  async createForPassport(
    passport: Passport,
    body: { label: string | null },
  ): Promise<PresentationConfiguration> {
    const config = PresentationConfiguration.create({
      organizationId: passport.organizationId,
      referenceId: passport.id,
      referenceType: PresentationReferenceType.Passport,
      label: body.label,
    });
    return await this.presentationConfigurationRepository.save(config);
  }

  async createForTemplate(
    template: Template,
    body: { label: string | null },
  ): Promise<PresentationConfiguration> {
    const config = PresentationConfiguration.create({
      organizationId: template.organizationId,
      referenceId: template.id,
      referenceType: PresentationReferenceType.Template,
      label: body.label,
    });
    return await this.presentationConfigurationRepository.save(config);
  }

  async applyPatchByConfigIdForPassport(
    passport: Passport,
    configId: string,
    patch: PresentationConfigurationPatchDto,
  ): Promise<PresentationConfiguration> {
    const config = await this.getByIdForPassport(passport, configId);
    return this.persistPatch(config, patch);
  }

  async applyPatchByConfigIdForTemplate(
    template: Template,
    configId: string,
    patch: PresentationConfigurationPatchDto,
  ): Promise<PresentationConfiguration> {
    const config = await this.getByIdForTemplate(template, configId);
    return this.persistPatch(config, patch);
  }

  async deleteByConfigIdForPassport(passport: Passport, configId: string): Promise<void> {
    await this.getByIdForPassport(passport, configId);
    await this.presentationConfigurationRepository.deleteById(configId);
  }

  async deleteByConfigIdForTemplate(template: Template, configId: string): Promise<void> {
    await this.getByIdForTemplate(template, configId);
    await this.presentationConfigurationRepository.deleteById(configId);
  }

  async getEffectiveForPassport(passport: Passport): Promise<PresentationConfiguration> {
    const [first] = await this.listForPassport(passport);
    return first;
  }

  async getEffectiveForTemplate(template: Template): Promise<PresentationConfiguration> {
    const [first] = await this.listForTemplate(template);
    return first;
  }

  async snapshotTemplateConfigsToPassport(
    passport: Passport,
    options?: DbSessionOptions,
  ): Promise<PresentationConfiguration[]> {
    if (!passport.templateId) return [];
    const templateConfigs = await this.presentationConfigurationRepository.findManyByReference(
      {
        referenceType: PresentationReferenceType.Template,
        referenceId: passport.templateId,
      },
      options,
    );
    if (templateConfigs.length === 0) return [];
    const created: PresentationConfiguration[] = [];
    for (const tc of templateConfigs) {
      const snapshot = PresentationConfiguration.create({
        organizationId: passport.organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
        label: tc.label,
        elementDesign: tc.elementDesign,
        defaultComponents: tc.defaultComponents,
      });
      created.push(await this.presentationConfigurationRepository.save(snapshot, options));
    }
    return created;
  }

  // Idempotent: returns the existing default config for the passport, or
  // creates one if none exists. Used by the scratch-passport creation path
  // (no template to snapshot from) and by the legacy UPI redirect to
  // backfill missing rows on the fly.
  async ensureDefaultForPassport(
    passport: Passport,
    options?: DbSessionOptions,
  ): Promise<PresentationConfiguration> {
    const existing = await this.presentationConfigurationRepository.findByReference(
      {
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      },
      options,
    );
    if (existing) return existing;
    return await this.presentationConfigurationRepository.save(
      PresentationConfiguration.createForPassport({
        organizationId: passport.organizationId,
        referenceId: passport.id,
      }),
      options,
    );
  }

  async listForPassportWithSession(
    passport: Passport,
    options?: DbSessionOptions,
  ): Promise<PresentationConfiguration[]> {
    return await this.presentationConfigurationRepository.findManyByReference(
      {
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      },
      options,
    );
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
    return await this.presentationConfigurationRepository.save(next);
  }
}
