import { Injectable } from "@nestjs/common";
import {
  KeyTypesType,
  Permissions,
  PresentationComponentNameType,
  PresentationConfigurationPatchDto,
  PresentationReferenceType,
  PresentationReferenceTypeType,
} from "@open-dpp/dto";
import { ForbiddenError, NotFoundError } from "@open-dpp/exception";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { AasAbility } from "../../../aas/domain/security/aas-ability";
import type { DbSessionOptions } from "../../../database/query-options";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { PresentationConfiguration } from "../../domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../infrastructure/presentation-configuration.repository";

@Injectable()
export class PresentationConfigurationService {
  constructor(
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
  ) {}

  async listForPassport(
    passport: Passport,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration[]> {
    const configs = await this.listOrSeed({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
      organizationId: passport.organizationId,
    });
    return configs.map((config) => filterReadable(config, ability));
  }

  async listForTemplate(
    template: Template,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration[]> {
    const configs = await this.listOrSeed({
      referenceType: PresentationReferenceType.Template,
      referenceId: template.id,
      organizationId: template.organizationId,
    });
    return configs.map((config) => filterReadable(config, ability));
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
    ability?: AasAbility,
  ): Promise<PresentationConfiguration> {
    const config = await this.requireOwned(configId, {
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
    });
    return filterReadable(config, ability);
  }

  async getByIdForTemplate(
    template: Template,
    configId: string,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration> {
    const config = await this.requireOwned(configId, {
      referenceType: PresentationReferenceType.Template,
      referenceId: template.id,
    });
    return filterReadable(config, ability);
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
    ability?: AasAbility,
  ): Promise<PresentationConfiguration> {
    const config = await this.requireOwned(configId, {
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
    });
    ensureWritable(patch.elementDesign, ability);
    return this.persistPatch(config, patch);
  }

  async applyPatchByConfigIdForTemplate(
    template: Template,
    configId: string,
    patch: PresentationConfigurationPatchDto,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration> {
    const config = await this.requireOwned(configId, {
      referenceType: PresentationReferenceType.Template,
      referenceId: template.id,
    });
    ensureWritable(patch.elementDesign, ability);
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

  async getEffectiveForPassport(
    passport: Passport,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration> {
    const [first] = await this.listForPassport(passport, ability);
    return first;
  }

  async getEffectiveForTemplate(
    template: Template,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration> {
    const [first] = await this.listForTemplate(template, ability);
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

  async findExistingForPassport(
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

function filterReadable(
  config: PresentationConfiguration,
  ability: AasAbility | undefined,
): PresentationConfiguration {
  if (!ability) return config;
  const allowed: Record<string, PresentationComponentNameType> = {};
  let stripped = false;
  for (const [path, component] of config.elementDesign) {
    if (ability.can(Permissions.Read, IdShortPath.create({ path }))) {
      allowed[path] = component;
    } else {
      stripped = true;
    }
  }
  if (!stripped) return config;
  return PresentationConfiguration.fromPlain({
    ...config.toPlain(),
    elementDesign: allowed,
  });
}

function ensureWritable(
  elementDesign: PresentationConfigurationPatchDto["elementDesign"],
  ability: AasAbility | undefined,
): void {
  if (!elementDesign || !ability) return;
  const denied: string[] = [];
  for (const path of Object.keys(elementDesign)) {
    if (!ability.can(Permissions.Edit, IdShortPath.create({ path }))) {
      denied.push(path);
    }
  }
  if (denied.length > 0) {
    throw new ForbiddenError(
      `Missing edit permission for presentation paths: ${denied.join(", ")}`,
    );
  }
}
