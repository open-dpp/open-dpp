import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  baseUrlOrigin,
  buildGs1DigitalLink,
  Gs1DataAttributes,
  PermalinkFallbackBaseUrlSource,
  PermalinkKind,
  type PermalinkKindType,
  PermalinkMetadataDtoSchema,
  DigitalProductDocumentTypes,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { Branding } from "../../../branding/domain/branding";
import { BrandingRepository } from "../../../branding/infrastructure/branding.repository";
import { DbSessionOptions } from "../../../database/query-options";
import { MembersService } from "../../../identity/organizations/application/services/members.service";
import { isDuplicateKeyErrorOnField } from "../../../lib/mongo-errors";
import { Pagination } from "../../../pagination/pagination";
import { Passport } from "../../../passports/domain/passport";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationService } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { Permalink } from "../../domain/permalink";
import { PermalinkRepository } from "../../infrastructure/permalink.repository";
import type { Gs1Identity } from "../../../unique-product-identifier/domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { BaseUrlResolver, resolveFallbackBaseUrl } from "./base-url-resolver.service";

export interface PermalinkAccessContext {
  userId?: string;
}

export interface PermalinkUpdate {
  slug?: string | null;
  baseUrl?: string | null;
  gs1DataAttributes?: Gs1DataAttributes | null;
  presentationConfigurationId?: string | null;
}

export interface PermalinkListItem {
  permalink: Permalink;
  publicUrl: string;
  fallbackBaseUrl: string;
  fallbackBaseUrlSource: PermalinkFallbackBaseUrlSource;
}

export interface CreateGs1LinkPermalinkInput {
  passportId: string;
  uniqueProductIdentifierId: string;
  organizationId: string;
  presentationConfigurationId?: string | null;
  gs1DataAttributes?: Gs1DataAttributes | null;
  slug?: string | null;
  baseUrl?: string | null;
}

export interface CreateOpenDppPermalinkInput {
  passportId: string;
  organizationId: string;
  presentationConfigurationId?: string | null;
  uniqueProductIdentifierId?: string | null;
  slug?: string | null;
  baseUrl?: string | null;
}

@Injectable()
export class PermalinkApplicationService {
  constructor(
    private readonly permalinkRepository: PermalinkRepository,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    private readonly presentationConfigurationService: PresentationConfigurationService,
    private readonly passportRepository: PassportRepository,
    private readonly brandingRepository: BrandingRepository,
    private readonly baseUrlResolver: BaseUrlResolver,
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    private readonly membersService: MembersService,
  ) {}

  async isMemberOfPassportOrg(
    passport: Passport,
    access: PermalinkAccessContext | undefined,
  ): Promise<boolean> {
    if (!access?.userId) {
      return false;
    }
    return await this.membersService.isMemberOfOrganization(access.userId, passport.organizationId);
  }

  async resolvePermalink(idOrSlug: string): Promise<Permalink> {
    if (z.uuid().safeParse(idOrSlug).success) {
      return await this.permalinkRepository.findOneOrFail(idOrSlug);
    }
    return await this.permalinkRepository.findBySlugOrFail(idOrSlug);
  }

  async resolveToPassport(
    idOrSlug: string,
    access?: PermalinkAccessContext,
  ): Promise<{
    permalink: Permalink;
    presentationConfiguration: PresentationConfiguration | null;
    passport: Passport;
  }> {
    const permalink = await this.resolvePermalink(idOrSlug);
    const passport = await this.passportRepository.findOneOrFail(permalink.passportId);
    if (!passport.isPublished() && !(await this.isMemberOfPassportOrg(passport, access))) {
      throw new NotFoundException(`Permalink ${permalink.id} not found`);
    }
    const presentationConfiguration =
      permalink.presentationConfigurationId === null
        ? null
        : await this.presentationConfigurationRepository.findOneOrFail(
            permalink.presentationConfigurationId,
          );
    if (
      presentationConfiguration !== null &&
      (presentationConfiguration.referenceType !== DigitalProductDocumentTypes.Passport ||
        presentationConfiguration.referenceId !== passport.id)
    ) {
      throw new NotFoundException(`Permalink ${permalink.id} does not target a passport`);
    }
    return { permalink, presentationConfiguration, passport };
  }

  async getMetadataByPermalink(idOrSlug: string, access?: PermalinkAccessContext) {
    const { passport } = await this.resolveToPassport(idOrSlug, access);
    return PermalinkMetadataDtoSchema.parse({
      organizationId: passport.organizationId,
      passportId: passport.id,
      templateId: passport.templateId,
    });
  }

  async createPermalinksForConfigs(
    configs: PresentationConfiguration[],
    organizationId: string,
    options?: DbSessionOptions,
  ): Promise<Permalink[]> {
    const results: Permalink[] = [];
    for (const config of configs) {
      if (config.referenceType !== DigitalProductDocumentTypes.Passport) {
        continue;
      }
      const existing = await this.permalinkRepository.findOpenDppByPresentationConfigurationId(
        config.id,
        options,
      );
      if (existing) {
        results.push(existing);
        continue;
      }
      const created = Permalink.create({
        passportId: config.referenceId,
        presentationConfigurationId: config.id,
        organizationId,
      });
      const saved = await this.permalinkRepository.save(created, options);
      results.push(await this.freezeNewPermalinkIfPublished(config, saved, options));
    }
    return results;
  }

  private async freezeNewPermalinkIfPublished(
    config: PresentationConfiguration,
    permalink: Permalink,
    options?: DbSessionOptions,
  ): Promise<Permalink> {
    if (config.referenceType !== DigitalProductDocumentTypes.Passport) {
      return permalink;
    }
    const passport = await this.passportRepository.findOne(config.referenceId);
    if (!passport || !passport.isPublished()) {
      return permalink;
    }
    const branding = await this.loadBranding(passport.organizationId);
    return this.freezePermalink(permalink, branding, await this.getPermalinkBaseUrl(), options);
  }

  async getPermalinkBaseUrl(): Promise<string> {
    return this.baseUrlResolver.getInstanceBaseUrl();
  }

  async freezePermalink(
    permalink: Permalink,
    branding: Branding | null,
    fallbackEnvUrl: string,
    options?: DbSessionOptions,
  ): Promise<Permalink> {
    if (permalink.publishedUrl !== null) {
      return permalink;
    }
    const publicUrl = await this.computeFreezeUrl(permalink, branding, fallbackEnvUrl);
    const frozen = permalink.withPublishedUrl(publicUrl);
    return await this.permalinkRepository.save(frozen, options);
  }

  private async computeFreezeUrl(
    permalink: Permalink,
    branding: Branding | null,
    fallbackEnvUrl: string,
  ): Promise<string> {
    if (permalink.kind !== PermalinkKind.GS1_LINK) {
      return resolvePublicUrl(permalink, branding, fallbackEnvUrl);
    }
    const upi = await this.uniqueProductIdentifierRepository.findOneOrFail(
      permalink.uniqueProductIdentifierId as string,
    );
    if (!upi.gs1) {
      throw new ValueError(
        `Cannot freeze gs1-link permalink ${permalink.id}: UPI ${upi.uuid} has no GS1 identity`,
      );
    }
    return resolveGs1LinkPublicUrl(permalink, upi.gs1, branding, fallbackEnvUrl);
  }

  async resolvePublicUrlWithFreeze(
    permalink: Permalink,
    passport: Passport,
    branding: Branding | null,
    fallbackEnvUrl: string,
    options?: DbSessionOptions,
  ): Promise<{ permalink: Permalink; publicUrl: string }> {
    if (permalink.publishedUrl !== null) {
      return { permalink, publicUrl: permalink.publishedUrl };
    }
    if (!passport.isPublished() || branding === null) {
      const gs1Identities = await this.loadGs1IdentitiesForPermalinks([permalink]);
      return {
        permalink,
        publicUrl: this.resolveReadUrl(permalink, gs1Identities, branding, fallbackEnvUrl),
      };
    }
    const frozen = await this.freezePermalink(permalink, branding, fallbackEnvUrl, options);
    return { permalink: frozen, publicUrl: frozen.publishedUrl as string };
  }

  async freezeAllForPassport(passport: Passport, options?: DbSessionOptions): Promise<void> {
    const permalinks = await this.permalinkRepository.findAllByPassportId(passport.id, options);
    if (permalinks.length === 0) {
      return;
    }
    const branding = await this.loadBranding(passport.organizationId);
    const fallbackEnvUrl = await this.getPermalinkBaseUrl();
    for (const permalink of permalinks) {
      await this.freezePermalink(permalink, branding, fallbackEnvUrl, options);
    }
  }

  async loadBranding(organizationId: string): Promise<Branding> {
    return await this.brandingRepository.findOneByOrganizationId(organizationId);
  }

  private async loadGs1IdentitiesForPermalinks(
    permalinks: Permalink[],
  ): Promise<Map<string, Gs1Identity>> {
    const upiIds = [
      ...new Set(
        permalinks
          .filter(
            (p) =>
              p.kind === PermalinkKind.GS1_LINK &&
              p.publishedUrl === null &&
              p.uniqueProductIdentifierId !== null,
          )
          .map((p) => p.uniqueProductIdentifierId as string),
      ),
    ];
    const upis = await this.uniqueProductIdentifierRepository.findByIds(upiIds);
    const identities = new Map<string, Gs1Identity>();
    for (const upi of upis) {
      if (upi.gs1) {
        identities.set(upi.uuid, upi.gs1);
      }
    }
    return identities;
  }

  private async resolvePageContext(
    permalinks: Permalink[],
    organizationId: string | null,
  ): Promise<{
    branding: Branding | null;
    envUrl: string;
    gs1Identities: Map<string, Gs1Identity>;
  }> {
    const branding = organizationId
      ? await this.baseUrlResolver.loadBrandingOrNull(organizationId)
      : null;
    const envUrl = await this.getPermalinkBaseUrl();
    const gs1Identities = await this.loadGs1IdentitiesForPermalinks(permalinks);
    return { branding, envUrl, gs1Identities };
  }

  private async renderListItems(
    permalinks: Permalink[],
    organizationId: string | null,
  ): Promise<PermalinkListItem[]> {
    const { branding, envUrl, gs1Identities } = await this.resolvePageContext(
      permalinks,
      organizationId,
    );
    const fallback = resolveFallbackBaseUrl(branding, envUrl);
    return permalinks.map((permalink) => ({
      permalink,
      publicUrl: this.resolveReadUrl(permalink, gs1Identities, branding, envUrl),
      fallbackBaseUrl: fallback.url,
      fallbackBaseUrlSource: fallback.source,
    }));
  }

  private resolveReadUrl(
    permalink: Permalink,
    gs1Identities: Map<string, Gs1Identity>,
    branding: Branding | null,
    envUrl: string,
  ): string {
    if (permalink.publishedUrl !== null) {
      return permalink.publishedUrl;
    }
    if (permalink.kind === PermalinkKind.GS1_LINK && permalink.uniqueProductIdentifierId !== null) {
      const gs1 = gs1Identities.get(permalink.uniqueProductIdentifierId);
      if (gs1) {
        return resolveGs1LinkPublicUrl(permalink, gs1, branding, envUrl);
      }
    }
    return resolvePublicUrl(permalink, branding, envUrl);
  }

  async updatePermalink(
    permalinkId: string,
    update: PermalinkUpdate,
    options?: DbSessionOptions,
  ): Promise<Permalink> {
    let next = await this.permalinkRepository.findOneOrFail(permalinkId);
    if (update.slug !== undefined) {
      next = next.withSlug(update.slug);
    }
    if (update.baseUrl !== undefined) {
      next = next.withBaseUrl(update.baseUrl);
    }
    if (update.gs1DataAttributes !== undefined) {
      next = next.withGs1DataAttributes(update.gs1DataAttributes);
    }
    if (update.presentationConfigurationId !== undefined) {
      next = next.withPresentationConfigurationId(update.presentationConfigurationId);
    }
    return await this.permalinkRepository.save(next, options);
  }

  async ensureDefaultForPassport(
    passport: Passport,
    options?: DbSessionOptions,
  ): Promise<Permalink> {
    const config = await this.presentationConfigurationService.ensureDefaultForPassport(
      passport,
      options,
    );
    const [permalink] = await this.createPermalinksForConfigs(
      [config],
      passport.organizationId,
      options,
    );
    return permalink;
  }

  async createOpenDppPermalink(
    input: CreateOpenDppPermalinkInput,
    options?: DbSessionOptions,
  ): Promise<Permalink> {
    const permalink = Permalink.create({
      kind: PermalinkKind.OPEN_DPP,
      passportId: input.passportId,
      presentationConfigurationId: input.presentationConfigurationId ?? null,
      uniqueProductIdentifierId: input.uniqueProductIdentifierId ?? null,
      slug: input.slug ?? null,
      baseUrl: input.baseUrl ?? null,
      organizationId: input.organizationId,
    });
    let saved: Permalink;
    try {
      saved = await this.permalinkRepository.save(permalink, options);
    } catch (error) {
      if (isDuplicateKeyErrorOnField(error, "slug")) {
        throw new ConflictException("Slug is already taken");
      }
      throw error;
    }
    const passport = await this.passportRepository.findOne(input.passportId);
    if (!passport || !passport.isPublished()) {
      return saved;
    }
    const branding = await this.loadBranding(passport.organizationId);
    return this.freezePermalink(saved, branding, await this.getPermalinkBaseUrl(), options);
  }

  async createGs1LinkPermalink(
    input: CreateGs1LinkPermalinkInput,
    options?: DbSessionOptions,
  ): Promise<Permalink> {
    const existing = await this.permalinkRepository.findGs1LinkByUpiId(
      input.uniqueProductIdentifierId,
      options,
    );
    if (existing) {
      throw new ConflictException(
        `A GS1-link permalink already exists for UPI ${input.uniqueProductIdentifierId}`,
      );
    }

    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: input.passportId,
      uniqueProductIdentifierId: input.uniqueProductIdentifierId,
      presentationConfigurationId: input.presentationConfigurationId ?? null,
      gs1DataAttributes: input.gs1DataAttributes ?? null,
      slug: input.slug ?? null,
      baseUrl: input.baseUrl ?? null,
      organizationId: input.organizationId,
    });

    try {
      return await this.permalinkRepository.save(permalink, options);
    } catch (error) {
      if (isDuplicateKeyErrorOnField(error, "uniqueProductIdentifierId")) {
        throw new ConflictException(
          `A GS1-link permalink already exists for UPI ${input.uniqueProductIdentifierId}`,
        );
      }
      if (isDuplicateKeyErrorOnField(error, "slug")) {
        throw new ConflictException("Slug is already taken");
      }
      throw error;
    }
  }

  async deleteGs1LinkForUpi(upiUuid: string, options?: DbSessionOptions): Promise<void> {
    const permalink = await this.permalinkRepository.findGs1LinkByUpiId(upiUuid, options);
    if (!permalink) return;
    if (permalink.publishedUrl !== null) {
      throw new ConflictException(
        `UPI ${upiUuid} is referenced by the published permalink ${permalink.id} and cannot be deleted`,
      );
    }
    await this.permalinkRepository.deleteById(permalink.id, options);
  }

  async deletePermalink(permalinkId: string, options?: DbSessionOptions): Promise<void> {
    const permalink = await this.permalinkRepository.findOneOrFail(permalinkId);

    if (permalink.publishedUrl !== null) {
      throw new ConflictException(
        `Permalink ${permalinkId} has been published and cannot be deleted`,
      );
    }

    await this.permalinkRepository.deleteById(permalinkId, options);
  }

  async listByOrganization(
    organizationId: string,
    pagination?: Pagination,
  ): Promise<{ items: PermalinkListItem[]; cursor: string | null }> {
    const result = await this.permalinkRepository.findAllByOrganizationId(organizationId, {
      pagination: {
        limit: pagination?.limit ?? undefined,
        cursor: pagination?.cursor ?? undefined,
      },
    });
    const items = await this.renderListItems(result.items, organizationId);
    return { items, cursor: result.pagination.cursor };
  }

  async listByPassport(
    passportId: string,
    pagination?: Pagination,
  ): Promise<{ items: PermalinkListItem[]; cursor: string | null }> {
    const result = await this.permalinkRepository.findPageByPassportId(passportId, {
      pagination: {
        limit: pagination?.limit ?? undefined,
        cursor: pagination?.cursor ?? undefined,
      },
    });
    const passport = await this.passportRepository.findOne(passportId);
    const items = await this.renderListItems(result.items, passport?.organizationId ?? null);
    return { items, cursor: result.pagination.cursor };
  }

  async getPermalinkSummariesByUpiIds(
    upiUuids: string[],
    organizationId: string,
  ): Promise<Map<string, { id: string; kind: PermalinkKindType; publicUrl: string }>> {
    if (upiUuids.length === 0) return new Map();
    const permalinks = await this.permalinkRepository.findLatestPermalinksByUpiIds(upiUuids);
    if (permalinks.size === 0) return new Map();
    const { branding, envUrl, gs1Identities } = await this.resolvePageContext(
      [...permalinks.values()],
      organizationId,
    );
    return new Map(
      [...permalinks].map(([upiUuid, permalink]) => [
        upiUuid,
        {
          id: permalink.id,
          kind: permalink.kind,
          publicUrl: this.resolveReadUrl(permalink, gs1Identities, branding, envUrl),
        },
      ]),
    );
  }
}

export function resolvePublicUrl(
  permalink: Permalink,
  branding: Branding | null,
  fallbackEnvUrl: string,
): string {
  const base = permalink.baseUrl ?? resolveFallbackBaseUrl(branding, fallbackEnvUrl).url;
  const slugOrId = permalink.slug ?? permalink.id;
  return `${base}/${slugOrId}`;
}

export function resolveGs1LinkPublicUrl(
  permalink: Permalink,
  gs1: Gs1Identity,
  branding: Branding | null,
  fallbackEnvUrl: string,
): string {
  const base = permalink.baseUrl ?? resolveFallbackBaseUrl(branding, fallbackEnvUrl).url;
  return buildGs1DigitalLink(baseUrlOrigin(base), {
    gtin: gs1.gtin,
    batch: gs1.batch,
    serial: gs1.serial,
    dataAttributes: permalink.gs1DataAttributes,
  });
}

export function resolvePresentationViewUrl(
  permalink: Permalink,
  branding: Branding | null,
  fallbackEnvUrl: string,
): string {
  const base = resolveFallbackBaseUrl(branding, fallbackEnvUrl).url;
  return `${base}/${permalink.slug ?? permalink.id}`;
}
