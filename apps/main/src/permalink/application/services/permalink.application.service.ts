import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  baseUrlOrigin,
  buildGs1DigitalLink,
  Gs1DataAttributes,
  PermalinkKind,
  PermalinkMetadataDtoSchema,
  PresentationReferenceType,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { Branding } from "../../../branding/domain/branding";
import { BrandingRepository } from "../../../branding/infrastructure/branding.repository";
import { DbSessionOptions } from "../../../database/query-options";
import type { MemberRoleType } from "../../../identity/organizations/domain/member-role.enum";
import { isDuplicateKeyError, isDuplicateKeyErrorOnField } from "../../../lib/mongo-errors";
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
  organizationId?: string;
  memberRole?: MemberRoleType;
}

export interface PermalinkUpdate {
  slug?: string | null;
  baseUrl?: string | null;
  gs1DataAttributes?: Gs1DataAttributes | null;
}

export interface CreateGs1LinkPermalinkInput {
  uniqueProductIdentifierId: string;
  organizationId: string;
  presentationConfigurationId?: string | null;
  gs1DataAttributes?: Gs1DataAttributes | null;
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
      throw new NotFoundException(
        `Permalink ${permalink.id} does not have a presentation configuration`,
      );
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

  /**
   * The instance base URL. Delegates to {@link BaseUrlResolver}, which owns the
   * base cascade (ADR 0004); kept here as the app-service entry point external
   * callers already depend on.
   */
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

  /**
   * The URL frozen into `publishedUrl`. A GS1-link permalink freezes as its
   * GS1 Digital Link URL (path from the referenced UPI's GS1 identity, query
   * from the permalink's gs1DataAttributes); every other kind freezes as the
   * presentation `base/slug` form.
   */
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

  /**
   * Batch-load the GS1 identities referenced by a page of permalinks, keyed by
   * UPI uuid. Only unfrozen gs1-link permalinks are considered — frozen ones read
   * their pinned `publishedUrl`, presentation permalinks have no UPI — so the
   * whole page costs a single `findByIds` query (no N+1). A UPI that is missing
   * or carries no GS1 identity is simply absent from the map; {@link resolveReadUrl}
   * then falls back to the presentation form.
   */
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

  /**
   * The read-time public URL for a permalink. A frozen permalink returns its
   * pinned `publishedUrl`; an unfrozen gs1-link whose GS1 identity resolved
   * renders the live GS1 Digital Link form (BE2); everything else — presentation
   * permalinks, and gs1-links whose UPI is missing/unresolvable — falls back to
   * the presentation `base/slug` form.
   */
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
   * - Invalid gs1DataAttributes surface as ValueError (delegated to domain/DTO).
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

    // Build the gs1-link permalink via Permalink.create (domain validates gs1DataAttributes)
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      uniqueProductIdentifierId: input.uniqueProductIdentifierId,
      presentationConfigurationId: input.presentationConfigurationId ?? null,
      gs1DataAttributes: input.gs1DataAttributes ?? null,
      baseUrl: input.baseUrl ?? null,
      primary: false,
      organizationId: input.organizationId,
    });

    try {
      return await this.permalinkRepository.save(permalink, options);
    } catch (error) {
      // Only a collision on the UPI index means "already exists for this UPI";
      // duplicates on other unique indexes (slug, presentationConfigurationId)
      // must surface as what they are, not as a phantom UPI conflict.
      if (isDuplicateKeyErrorOnField(error, "uniqueProductIdentifierId")) {
        throw new ConflictException(
          `A GS1-link permalink already exists for UPI ${input.uniqueProductIdentifierId}`,
        );
      }
      throw error;
    }
  }

  /**
   * Delete the gs1-link permalink referencing a UPI (cascade for UPI deletion).
   * No-op when none exists; a published (frozen) permalink blocks the delete.
   */
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
   * by the public `/p` endpoints. Unfrozen gs1-link permalinks render their live
   * GS1 Digital Link URL — the page's UPI GS1 identities are batch-loaded in one
   * query (no N+1) and threaded through {@link resolveReadUrl}; a gs1-link whose
   * UPI is missing/unresolvable falls back to the presentation `base/slug` form.
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
    const branding = await this.baseUrlResolver.loadBrandingOrNull(organizationId);
    const envUrl = await this.getPermalinkBaseUrl();
    const fallback = resolveFallbackBaseUrl(branding, envUrl);
    const gs1Identities = await this.loadGs1IdentitiesForPermalinks(result.items);
    const items = result.items.map((permalink) => ({
      permalink,
      publicUrl: this.resolveReadUrl(permalink, gs1Identities, branding, envUrl),
      fallbackBaseUrl: fallback.url,
      fallbackBaseUrlSource: fallback.source,
    }));
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
      ? await this.baseUrlResolver.loadBrandingOrNull(passport.organizationId)
      : null;
    const envUrl = await this.getPermalinkBaseUrl();
    const fallback = resolveFallbackBaseUrl(branding, envUrl);
    const gs1Identities = await this.loadGs1IdentitiesForPermalinks(result.items);
    const items = result.items.map((permalink) => ({
      permalink,
      publicUrl: this.resolveReadUrl(permalink, gs1Identities, branding, envUrl),
      fallbackBaseUrl: fallback.url,
      fallbackBaseUrlSource: fallback.source,
    }));
    return { items, cursor: result.pagination.cursor };
  }

  /**
   * Batch-resolve gs1-link permalink summaries for a page of UPI uuids,
   * keyed by UPI uuid (max one gs1-link permalink per UPI). Used to enrich
   * UPI list rows; publicUrl follows the same rule as the list paths via
   * {@link resolveReadUrl}: frozen → pinned `publishedUrl`, unfrozen → live GS1
   * Digital Link form (GS1 identities batch-loaded in one query), missing UPI →
   * presentation `base/slug` fallback.
   */
  async getGs1LinkSummariesByUpiIds(
    upiUuids: string[],
    organizationId: string,
  ): Promise<Map<string, { id: string; publicUrl: string }>> {
    if (upiUuids.length === 0) return new Map();
    const permalinks = await this.permalinkRepository.findGs1LinksByUpiIds(upiUuids);
    if (permalinks.size === 0) return new Map();
    const branding = await this.baseUrlResolver.loadBrandingOrNull(organizationId);
    const envUrl = await this.getPermalinkBaseUrl();
    const gs1Identities = await this.loadGs1IdentitiesForPermalinks([...permalinks.values()]);
    return new Map(
      [...permalinks].map(([upiUuid, permalink]) => [
        upiUuid,
        {
          id: permalink.id,
          publicUrl: this.resolveReadUrl(permalink, gs1Identities, branding, envUrl),
        },
      ]),
    );
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
 * Render a gs1-link permalink as its GS1 Digital Link URL:
 * `{base}/01/{gtin}[/10/{batch}][/21/{serial}][?attrs]`.
 *
 * The base follows the same permalink cascade as {@link resolvePublicUrl}
 * (`permalink.baseUrl` → branding → instance default — NOT the UPI-level
 * resolver base); the path comes from the referenced UPI's GS1 identity and the
 * query from the permalink's `gs1DataAttributes`. Shared by the freeze path
 * (BE1) and the read-time live path (BE2).
 */
export function resolveGs1LinkPublicUrl(
  permalink: Permalink,
  gs1: Gs1Identity,
  branding: Branding | null,
  fallbackEnvUrl: string,
): string {
  const base = permalink.baseUrl ?? resolveFallbackBaseUrl(branding, fallbackEnvUrl).url;
  // The GS1 Digital Link resolver is mounted at the domain root (`/01/{gtin}`), so
  // the link renders on the base's ORIGIN. Any path the cascade base carries — most
  // notably the presentation viewer's `/p` in the instance-default fallback — would
  // make `{base}/01/…` unreachable by the root resolver.
  return buildGs1DigitalLink(baseUrlOrigin(base), {
    gtin: gs1.gtin,
    batch: gs1.batch,
    serial: gs1.serial,
    dataAttributes: permalink.gs1DataAttributes,
  });
}
