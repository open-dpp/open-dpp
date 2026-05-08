import { Injectable, NotFoundException } from "@nestjs/common";
import { PermalinkMetadataDtoSchema, PresentationReferenceType } from "@open-dpp/dto";
import { z } from "zod/v4";
import { Branding } from "../../../branding/domain/branding";
import { DbSessionOptions } from "../../../database/query-options";
import type { MemberRoleType } from "../../../identity/organizations/domain/member-role.enum";
import { Passport } from "../../../passports/domain/passport";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationService } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { Permalink } from "../../domain/permalink";
import { PermalinkRepository } from "../../infrastructure/permalink.repository";

// Caller's auth context for the resolver. Allows the resolver to gate access
// to non-published passports without coupling the application service to
// HTTP / decorator types.
export interface PermalinkAccessContext {
  organizationId?: string;
  memberRole?: MemberRoleType;
}

// Partial update for a permalink. `undefined` (key absent) leaves the field
// untouched; `null` clears it; a value sets it. Mirrors the wire schema so
// the controller can pass the parsed body straight through.
export interface PermalinkUpdate {
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
    const presentationConfiguration = await this.presentationConfigurationRepository.findOneOrFail(
      permalink.presentationConfigurationId,
    );
    if (presentationConfiguration.referenceType !== PresentationReferenceType.Passport) {
      throw new NotFoundException(`Permalink ${permalink.id} does not target a passport`);
    }
    const passport = await this.passportRepository.findOneOrFail(
      presentationConfiguration.referenceId,
    );
    // Hide non-published passports from anonymous and cross-org viewers.
    // Members of the owning org keep access (preview for drafts, audit for
    // archived). Returning 404 (not 403) avoids leaking the existence of
    // an unpublished passport to outsiders.
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

  // Pure tail: given a list of presentation configs, return one permalink per
  // config. Idempotent — if a permalink already exists for a config (the unique
  // index on presentationConfigurationId guarantees at most one), return it
  // instead of trying to create a duplicate. Order of the returned array
  // mirrors the input order so callers can rely on configs[0] ↔ permalinks[0]
  // for picking a canonical default.
  async createPermalinksForConfigs(
    configs: PresentationConfiguration[],
    options?: DbSessionOptions,
  ): Promise<Permalink[]> {
    const results: Permalink[] = [];
    for (const config of configs) {
      const existing = await this.permalinkRepository.findByPresentationConfigurationId(
        config.id,
        options,
      );
      if (existing) {
        results.push(existing);
        continue;
      }
      const created = Permalink.create({ presentationConfigurationId: config.id });
      results.push(await this.permalinkRepository.save(created, options));
    }
    return results;
  }

  // Partial update. Each field is independent: pass undefined / omit the key
  // to leave it alone; pass null to clear; pass a value to set. Validation
  // (slug shape, base URL canonicalisation) lives in the domain `with*`
  // methods and surfaces as ValueError; duplicate-slug collisions surface as
  // a Mongo duplicate-key error from the unique index.
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
    return await this.permalinkRepository.save(next, options);
  }

  // TODO: remove after the eager-migration script (Option a) backfills every
  // pre-refactor passport. Once the lazy callers (legacy UPI redirect +
  // backoffice GET /p?passportId=...) stop hitting the synthesise branch,
  // delete this method and inline the eager flow into PassportController.create.
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
}

export function isMemberOfPassportOrg(
  passport: Passport,
  access: PermalinkAccessContext | undefined,
): boolean {
  if (!access) return false;
  if (access.memberRole === undefined) return false;
  return access.organizationId === passport.organizationId;
}

// Pure resolver for the public URL of a permalink. Layered fallback:
//   1. Per-permalink override (`Permalink.baseUrl`)
//   2. Org-level white-label default (`Branding.permalinkBaseUrl`)
//   3. Instance-wide env (`OPEN_DPP_URL`), normalised to its origin
// The slug takes precedence over the UUID so customers' QR codes / share
// links stay branded once a slug is assigned. Returns the full public URL
// the QR code should encode.
export function resolvePublicUrl(
  permalink: Permalink,
  branding: Branding | null,
  fallbackEnvUrl: string,
): string {
  const base = permalink.baseUrl ?? branding?.permalinkBaseUrl ?? new URL(fallbackEnvUrl).origin;
  const slugOrId = permalink.slug ?? permalink.id;
  return `${base}/p/${slugOrId}`;
}
