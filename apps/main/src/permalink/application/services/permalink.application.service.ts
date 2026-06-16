import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  canonicaliseBaseUrl,
  Gs1DataAttributes,
  PermalinkFallbackBaseUrlSource,
  PermalinkKind,
  PermalinkMetadataDtoSchema,
  PresentationReferenceType,
} from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { z } from "zod/v4";
import { Branding } from "../../../branding/domain/branding";
import { BrandingRepository } from "../../../branding/infrastructure/branding.repository";
import { DbSessionOptions } from "../../../database/query-options";
import type { MemberRoleType } from "../../../identity/organizations/domain/member-role.enum";
import { InstanceSettingsService } from "../../../instance-settings/application/services/instance-settings.service";
import { computePermalinkBaseUrlFallback } from "../../../lib/permalink-fallback";
import { isDuplicateKeyError } from "../../../lib/mongo-errors";
import { Pagination } from "../../../pagination/pagination";
import { Passport } from "../../../passports/domain/passport";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationService } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { Permalink } from "../../domain/permalink";
import { PermalinkRepository } from "../../infrastructure/permalink.repository";

export interface PermalinkAccessContext {
  organizationId?: string;
  memberRole?: MemberRoleType;
}

export interface PermalinkUpdate {
  slug?: string | null;
  baseUrl?: string | null;
  gs1ResolverBase?: string | null;
  gs1DataAttributes?: Gs1DataAttributes | null;
}

export interface CreateGs1LinkPermalinkInput {
  uniqueProductIdentifierId: string;
  presentationConfigurationId?: string | null;
  gs1ResolverBase?: string | null;
  gs1DataAttributes?: Gs1DataAttributes | null;
}

@Injectable()
export class PermalinkApplicationService {
  constructor(
    private readonly permalinkRepository: PermalinkRepository,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    private readonly presentationConfigurationService: PresentationConfigurationService,
    private readonly passportRepository: PassportRepository,
    private readonly brandingRepository: BrandingRepository,
    private readonly envService: EnvService,
    private readonly instanceSettingsService: InstanceSettingsService,
  ) {}

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
    presentationConfiguration: PresentationConfiguration;
    passport: Passport;
  }> {
    const permalink = await this.resolvePermalink(idOrSlug);
    if (permalink.presentationConfigurationId === null) {
      throw new NotFoundException(`Permalink ${permalink.id} does not have a presentation configuration`);
    }
    const presentationConfiguration = await this.presentationConfigurationRepository.findOneOrFail(
      permalink.presentationConfigurationId,
    );
    if (presentationConfiguration.referenceType !== PresentationReferenceType.Passport) {
      throw new NotFoundException(`Permalink ${permalink.id} does not target a passport`);
    }
    const passport = await this.passportRepository.findOneOrFail(
      presentationConfiguration.referenceId,
    );
    if (!passport.isPublished() && !isMemberOfPassportOrg(passport, access)) {
      throw new NotFoundException(`Permalink ${permalink.id} not found`);
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
    options?: DbSessionOptions,
  ): Promise<Permalink[]> {
    const results: Permalink[] = [];
    // Track whether a primary has been assigned during this call (to handle multi-config batches)
    let primaryAssignedInThisCall = false;
    for (const config of configs) {
      const existing = await this.permalinkRepository.findByPresentationConfigurationId(
        config.id,
        options,
      );
      if (existing) {
        results.push(existing);
        // An existing primary counts as already assigned
        if (existing.primary) {
          primaryAssignedInThisCall = true;
        }
        continue;
      }
      // Determine whether this new presentation permalink should be primary:
      // It becomes primary if no primary presentation permalink exists yet for this passport.
      let shouldBePrimary = false;
      if (
        !primaryAssignedInThisCall &&
        config.referenceType === PresentationReferenceType.Passport
      ) {
        const existingPrimary = await this.permalinkRepository.findPrimaryByPassportId(
          config.referenceId,
          options,
        );
        if (!existingPrimary) {
          shouldBePrimary = true;
          primaryAssignedInThisCall = true;
        }
      }
      const created = Permalink.create({
        presentationConfigurationId: config.id,
        primary: shouldBePrimary,
      });
      let saved: Permalink;
      try {
        saved = await this.permalinkRepository.save(created, options);
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
        const recovered = await this.permalinkRepository.findByPresentationConfigurationId(
          config.id,
          options,
        );
        if (!recovered) throw error;
        results.push(recovered);
        continue;
      }
      results.push(await this.freezeNewPermalinkIfPublished(config, saved, options));
    }
    return results;
  }

  private async freezeNewPermalinkIfPublished(
    config: PresentationConfiguration,
    permalink: Permalink,
    options?: DbSessionOptions,
  ): Promise<Permalink> {
    if (config.referenceType !== PresentationReferenceType.Passport) {
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
    const settings = await this.instanceSettingsService.getSettings();
    if (settings.permalinkBaseUrl.value !== null) {
      return settings.permalinkBaseUrl.value;
    }
    return computePermalinkBaseUrlFallback(this.envService.get("OPEN_DPP_URL"));
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
    const frozen = permalink.withPublishedUrl(
      resolvePublicUrl(permalink, branding, fallbackEnvUrl),
    );
    return await this.permalinkRepository.save(frozen, options);
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
      return {
        permalink,
        publicUrl: resolvePublicUrl(permalink, branding, fallbackEnvUrl),
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
    if (update.gs1ResolverBase !== undefined) {
      next = next.withGs1ResolverBase(update.gs1ResolverBase);
    }
    if (update.gs1DataAttributes !== undefined) {
      next = next.withGs1DataAttributes(update.gs1DataAttributes);
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
    const [permalink] = await this.createPermalinksForConfigs([config], options);
    return permalink;
  }

  /**
   * Create an additional presentation permalink for a passport + config.
   *
   * The new permalink is always non-primary (an existing primary stays intact).
   * If the passport is already published, the new permalink is frozen on create
   * (reusing the existing freezeNewPermalinkIfPublished logic via createPermalinksForConfigs).
   */
  async createPresentationPermalink(
    passport: Passport,
    config: PresentationConfiguration,
    options?: DbSessionOptions,
  ): Promise<Permalink> {
    const [permalink] = await this.createPermalinksForConfigs([config], options);
    return permalink;
  }

  /**
   * Create a GS1 Digital Link permalink referencing a UPI.
   *
   * Rules:
   * - Exactly one gs1-link permalink per UPI (enforced by partial unique index + pre-check).
   * - gs1-link permalinks are never primary.
   * - Invalid gs1DataAttributes or gs1ResolverBase surface as ValueError (delegated to domain/DTO).
   * - A second permalink for the same UPI throws ConflictException.
   */
  async createGs1LinkPermalink(
    input: CreateGs1LinkPermalinkInput,
    options?: DbSessionOptions,
  ): Promise<Permalink> {
    // Pre-check: enforce at most one gs1-link permalink per UPI
    const existing = await this.permalinkRepository.findGs1LinkByUpiId(
      input.uniqueProductIdentifierId,
      options,
    );
    if (existing) {
      throw new ConflictException(
        `A GS1-link permalink already exists for UPI ${input.uniqueProductIdentifierId}`,
      );
    }

    // Build the gs1-link permalink via Permalink.create (domain validates gs1DataAttributes/gs1ResolverBase)
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      uniqueProductIdentifierId: input.uniqueProductIdentifierId,
      presentationConfigurationId: input.presentationConfigurationId ?? null,
      gs1ResolverBase: input.gs1ResolverBase ?? null,
      gs1DataAttributes: input.gs1DataAttributes ?? null,
      primary: false,
    });

    try {
      return await this.permalinkRepository.save(permalink, options);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          `A GS1-link permalink already exists for UPI ${input.uniqueProductIdentifierId}`,
        );
      }
      throw error;
    }
  }

  /**
   * Delete a permalink with guarded-delete rules:
   *
   * - A published permalink (publishedUrl set) is frozen and cannot be deleted → ConflictException.
   * - A presentation permalink that is the last one for its passport → ConflictException.
   * - A presentation permalink that is the primary while another exists → ConflictException
   *   (the caller must reassign primary first).
   * - A non-primary, unpublished presentation permalink → deleted.
   * - An unpublished gs1-link permalink → deleted (regardless of primary flag; gs1-link is never primary).
   */
  async deletePermalink(permalinkId: string, options?: DbSessionOptions): Promise<void> {
    const permalink = await this.permalinkRepository.findOneOrFail(permalinkId);

    // Freeze rule: any published permalink is immutable
    if (permalink.publishedUrl !== null) {
      throw new ConflictException(
        `Permalink ${permalinkId} has been published and cannot be deleted`,
      );
    }

    if (permalink.kind === PermalinkKind.PRESENTATION) {
      // Load all presentation permalinks for this passport to enforce guarded-delete rules
      if (permalink.presentationConfigurationId === null) {
        // Defensive: a presentation permalink should always have a config id
        throw new ConflictException(
          `Permalink ${permalinkId} is a presentation permalink but has no presentationConfigurationId`,
        );
      }
      const config = await this.presentationConfigurationRepository.findOneOrFail(
        permalink.presentationConfigurationId,
      );
      const passportId = config.referenceId;
      const allPresentation = await this.permalinkRepository.findAllByPassportId(
        passportId,
        options,
      );

      // Guard: cannot delete the last presentation permalink for a passport
      if (allPresentation.length <= 1) {
        throw new ConflictException(
          `Cannot delete the last presentation permalink for passport ${passportId}`,
        );
      }

      // Guard: cannot delete the primary while another exists — reassign primary first
      if (permalink.primary) {
        throw new ConflictException(
          `Cannot delete the primary presentation permalink ${permalinkId}; reassign primary first`,
        );
      }
    }

    // gs1-link: allowed when unpublished (freeze rule already checked above)
    await this.permalinkRepository.deleteById(permalinkId, options);
  }

  /**
   * List all permalinks belonging to an organisation, newest-first, with
   * cursor-based pagination.
   *
   * The incoming `pagination` (limit + cursor) is forwarded to the repository's
   * `_id`-based cursor query; the repository's advanced cursor is surfaced as
   * `cursor` on the result (null on the last page / empty org).
   *
   * Resolves publicUrl for each item using the same branding-aware fallback used
   * by the public `/p` endpoints.  For gs1-link permalinks the URL is computed
   * from the fallback base (resolver base cascade) + permalink id/slug because
   * the UPI's GS1 key (gtin/batch/serial) is not loaded at list-time.
   */
  async listByOrganization(
    organizationId: string,
    pagination?: Pagination,
  ): Promise<{
    items: Array<{
      permalink: Permalink;
      publicUrl: string;
      fallbackBaseUrl: string;
      fallbackBaseUrlSource: "branding" | "instance";
    }>;
    cursor: string | null;
  }> {
    const result = await this.permalinkRepository.findAllByOrganizationId(organizationId, {
      pagination: {
        limit: pagination?.limit ?? undefined,
        cursor: pagination?.cursor ?? undefined,
      },
    });
    const branding = await this.loadBranding(organizationId).catch(() => null);
    const envUrl = await this.getPermalinkBaseUrl();
    const fallback = resolveFallbackBaseUrl(branding, envUrl);
    const items = result.items.map((permalink) => {
      const publicUrl = permalink.publishedUrl ?? resolvePublicUrl(permalink, branding, envUrl);
      return {
        permalink,
        publicUrl,
        fallbackBaseUrl: fallback.url,
        fallbackBaseUrlSource: fallback.source,
      };
    });
    return { items, cursor: result.pagination.cursor };
  }

  /**
   * List ALL permalinks belonging to a single passport — the union of its
   * presentation and gs1-link permalinks (see `findPageByPassportId`) — newest
   * first, with cursor-based pagination. The passport-scoped sibling of
   * `listByOrganization`.
   *
   * Branding (for the publicUrl/fallback cascade) is resolved from the passport's
   * own organisation, so the controller only needs the passport id.
   */
  async listByPassport(
    passportId: string,
    pagination?: Pagination,
  ): Promise<{
    items: Array<{
      permalink: Permalink;
      publicUrl: string;
      fallbackBaseUrl: string;
      fallbackBaseUrlSource: "branding" | "instance";
    }>;
    cursor: string | null;
  }> {
    const result = await this.permalinkRepository.findPageByPassportId(passportId, {
      pagination: {
        limit: pagination?.limit ?? undefined,
        cursor: pagination?.cursor ?? undefined,
      },
    });
    const passport = await this.passportRepository.findOne(passportId);
    const branding = passport
      ? await this.loadBranding(passport.organizationId).catch(() => null)
      : null;
    const envUrl = await this.getPermalinkBaseUrl();
    const fallback = resolveFallbackBaseUrl(branding, envUrl);
    const items = result.items.map((permalink) => {
      const publicUrl = permalink.publishedUrl ?? resolvePublicUrl(permalink, branding, envUrl);
      return {
        permalink,
        publicUrl,
        fallbackBaseUrl: fallback.url,
        fallbackBaseUrlSource: fallback.source,
      };
    });
    return { items, cursor: result.pagination.cursor };
  }

  /**
   * Move the `primary` flag to the given permalink within a passport.
   *
   * Rules:
   * - The target must be a presentation permalink (gs1-link → ConflictException).
   * - The target must belong to the given passport (verified via findAllByPassportId → NotFoundException).
   * - Exactly one presentation permalink ends up with primary:true.
   */
  async setPrimary(
    passportId: string,
    permalinkId: string,
    options?: DbSessionOptions,
  ): Promise<void> {
    // Load target permalink first to validate it exists and check its kind
    const target = await this.permalinkRepository.findOne(permalinkId);
    if (!target) {
      throw new NotFoundException(`Permalink ${permalinkId} not found`);
    }
    // Reject gs1-link as primary (primary is presentation-only)
    if (target.kind === PermalinkKind.GS1_LINK) {
      throw new ConflictException(
        `Permalink ${permalinkId} is a gs1-link and cannot be set as primary`,
      );
    }
    // Load all presentation permalinks for the passport to validate ownership
    const all = await this.permalinkRepository.findAllByPassportId(passportId, options);
    const targetInPassport = all.find((p) => p.id === permalinkId);
    if (!targetInPassport) {
      throw new NotFoundException(
        `Permalink ${permalinkId} does not belong to passport ${passportId}`,
      );
    }
    // Persist: promote target to primary, demote any existing primary
    for (const p of all) {
      if (p.id === permalinkId) {
        if (!p.primary) {
          await this.permalinkRepository.save(p.withPrimary(true), options);
        }
      } else if (p.primary) {
        await this.permalinkRepository.save(p.withPrimary(false), options);
      }
    }
  }
}

export function isMemberOfPassportOrg(
  passport: Passport,
  access: PermalinkAccessContext | undefined,
): boolean {
  if (!access) return false;
  if (access.memberRole === undefined) return false;
  return access.organizationId === passport.organizationId;
}

export function resolveFallbackBaseUrl(
  branding: Branding | null,
  fallbackEnvUrl: string,
): { url: string; source: PermalinkFallbackBaseUrlSource } {
  if (branding?.permalinkBaseUrl) {
    return { url: branding.permalinkBaseUrl, source: "branding" };
  }
  return { url: canonicaliseBaseUrl(fallbackEnvUrl), source: "instance" };
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

/**
 * Resolve the GS1 Digital Link resolver base URL for a GS1-link permalink.
 *
 * Precedence (highest → lowest):
 *   1. permalink.gs1ResolverBase  — per-permalink override
 *   2. branding.gs1ResolverBaseUrl — org branding
 *   3. fallbackEnvUrl (canonicalised OPEN_DPP_URL) — instance setting / environment
 *
 * The result is always canonicalised: host lowercased, trailing slash stripped.
 */
export function resolveGs1ResolverBase(
  permalink: Permalink,
  branding: Branding | null,
  fallbackEnvUrl: string,
): string {
  if (permalink.gs1ResolverBase !== null) {
    return canonicaliseBaseUrl(permalink.gs1ResolverBase);
  }
  if (branding?.gs1ResolverBaseUrl) {
    return branding.gs1ResolverBaseUrl;
  }
  return canonicaliseBaseUrl(fallbackEnvUrl);
}
