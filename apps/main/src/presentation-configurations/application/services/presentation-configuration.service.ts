import { Injectable } from "@nestjs/common";
import {
  Permissions,
  PresentationComponentNameType,
  PresentationConfigurationPatchDto,
  PresentationReferenceType,
  PresentationReferenceTypeType,
} from "@open-dpp/dto";
import { NotFoundError } from "@open-dpp/exception";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { AasAbility } from "../../../aas/domain/security/aas-ability";
import type { DbSessionOptions } from "../../../database/query-options";
import { Passport } from "../../../passports/domain/passport";
import { PresentationConfiguration } from "../../domain/presentation-configuration";
import {
  PresentationConfigurationReference,
  PresentationConfigurationRepository,
} from "../../infrastructure/presentation-configuration.repository";

/**
 * Minimal shape required by the service to identify a passport/template reference.
 * Both `Passport` and `Template` expose `id` and `organizationId` as public readonly fields,
 * so instances of either class satisfy this interface directly.
 */
export interface PresentationReferenceHolder {
  readonly id: string;
  readonly organizationId: string;
  readonly referenceType: PresentationReferenceTypeType;
}

@Injectable()
export class PresentationConfigurationService {
  constructor(
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
  ) {}

  async list(
    holder: PresentationReferenceHolder,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration[]> {
    const configs = await this.listOrSeed({
      referenceType: holder.referenceType,
      referenceId: holder.id,
      organizationId: holder.organizationId,
    });
    return configs.map((config) => filterReadable(config, ability));
  }

  async getById(
    holder: PresentationReferenceHolder,
    configId: string,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration> {
    const config = await this.requireOwned(configId, {
      referenceType: holder.referenceType,
      referenceId: holder.id,
    });
    return filterReadable(config, ability);
  }

  async create(
    holder: PresentationReferenceHolder,
    body: { label: string | null },
  ): Promise<PresentationConfiguration> {
    const config = PresentationConfiguration.create({
      organizationId: holder.organizationId,
      referenceId: holder.id,
      referenceType: holder.referenceType,
      label: body.label,
    });
    return await this.presentationConfigurationRepository.save(config);
  }

  async applyPatch(
    holder: PresentationReferenceHolder,
    configId: string,
    patch: PresentationConfigurationPatchDto,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration> {
    const config = await this.requireOwned(configId, {
      referenceType: holder.referenceType,
      referenceId: holder.id,
    });
    return this.persistPatch(config, patch, ability);
  }

  async delete(holder: PresentationReferenceHolder, configId: string): Promise<void> {
    await this.getById(holder, configId);
    await this.presentationConfigurationRepository.deleteById(configId);
  }

  async getEffective(
    holder: PresentationReferenceHolder,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration> {
    const [first] = await this.list(holder, ability);
    return first;
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

  /**
   * Removes all `elementDesign` entries from every config belonging to the given reference
   * whose key is exactly `idShortPath` or starts with `idShortPath.` (child paths).
   * Only configs that actually changed are saved. Runs inside the provided session when given.
   */
  async removeElementDesignEntriesForPath(
    referenceType: PresentationReferenceTypeType,
    referenceId: string,
    idShortPath: string,
    options?: DbSessionOptions,
  ): Promise<void> {
    const ref: PresentationConfigurationReference = { referenceType, referenceId };
    const configs = await this.presentationConfigurationRepository.findManyByReference(
      ref,
      options,
    );
    const childPrefix = `${idShortPath}.`;
    for (const config of configs) {
      let updated: PresentationConfiguration = config;
      for (const key of config.elementDesign.keys()) {
        if (key === idShortPath || key.startsWith(childPrefix)) {
          updated = updated.withoutElementDesign(key);
        }
      }
      if (updated !== config) {
        await this.presentationConfigurationRepository.save(updated, options);
      }
    }
  }

  private async persistPatch(
    config: PresentationConfiguration,
    patch: PresentationConfigurationPatchDto,
    ability?: AasAbility,
  ): Promise<PresentationConfiguration> {
    const next = config.withPatch(patch, ability);
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
