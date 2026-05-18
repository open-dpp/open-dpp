import { Injectable, NotFoundException } from "@nestjs/common";
import {
  PermalinkFallbackBaseUrlSource,
  PermalinkMetadataDtoSchema,
  PresentationReferenceType,
} from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { z } from "zod/v4";
import { Branding } from "../../../branding/domain/branding";
import { BrandingRepository } from "../../../branding/infrastructure/branding.repository";
import { DbSessionOptions } from "../../../database/query-options";
import type { MemberRoleType } from "../../../identity/organizations/domain/member-role.enum";
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
    if (config.referenceType !== PresentationReferenceType.Passport) {
      return permalink;
    }
    const passport = await this.passportRepository.findOne(config.referenceId);
    if (!passport || !passport.isPublished()) {
      return permalink;
    }
    const branding = await this.loadBranding(passport.organizationId);
    return this.freezePermalink(permalink, branding, this.envService.get("OPEN_DPP_URL"), options);
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
    if (!passport.isPublished()) {
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
    const fallbackEnvUrl = this.envService.get("OPEN_DPP_URL");
    for (const permalink of permalinks) {
      await this.freezePermalink(permalink, branding, fallbackEnvUrl, options);
    }
  }

  private async loadBranding(organizationId: string): Promise<Branding> {
    try {
      return await this.brandingRepository.findOneByOrganizationId(organizationId);
    } catch {
      return Branding.getDefault();
    }
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
  return { url: new URL(fallbackEnvUrl).origin, source: "instance" };
}

export function resolvePublicUrl(
  permalink: Permalink,
  branding: Branding | null,
  fallbackEnvUrl: string,
): string {
  const base = permalink.baseUrl ?? resolveFallbackBaseUrl(branding, fallbackEnvUrl).url;
  const slugOrId = permalink.slug ?? permalink.id;
  return `${base}/p/${slugOrId}`;
}
