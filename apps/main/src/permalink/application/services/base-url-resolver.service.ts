import { Injectable } from "@nestjs/common";
import { canonicaliseBaseUrl, PermalinkFallbackBaseUrlSource } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { Branding } from "../../../branding/domain/branding";
import { BrandingRepository } from "../../../branding/infrastructure/branding.repository";
import { InstanceSettingsService } from "../../../instance-settings/application/services/instance-settings.service";
import { computePermalinkBaseUrlFallback } from "../../../lib/permalink-fallback";

/**
 * The single owner of the permalink base-URL cascade
 * (`permalink.baseUrl → branding.permalinkBaseUrl → instance OPEN_DPP_URL`).
 *
 * Per ADR 0004 there is one base-URL concept, so there is one resolver: it owns
 * the instance base, the tolerant per-org branding load, and the branding →
 * instance fallback. `PermalinkApplicationService` keeps URL *rendering*
 * (presentation `base/{slug|id}` vs GS1 Digital Link `origin/01/{gtin}…`) but
 * delegates base *resolution* here; the GS1 read/collection services resolve
 * their Digital Link base through {@link getResolverBase} instead of reaching
 * back into the permalink service (this replaces the old `Gs1ResolverBaseService`).
 */
@Injectable()
export class BaseUrlResolver {
  constructor(
    private readonly brandingRepository: BrandingRepository,
    private readonly envService: EnvService,
    private readonly instanceSettingsService: InstanceSettingsService,
  ) {}

  /**
   * The instance-level base URL: the `permalinkBaseUrl` instance setting when
   * set, else the canonicalised `OPEN_DPP_URL` fallback (with `/p` appended).
   */
  async getInstanceBaseUrl(): Promise<string> {
    const settings = await this.instanceSettingsService.getSettings();
    if (settings.permalinkBaseUrl.value !== null) {
      return settings.permalinkBaseUrl.value;
    }
    return computePermalinkBaseUrlFallback(this.envService.get("OPEN_DPP_URL"));
  }

  /**
   * Load an organization's branding, tolerating an absent org/branding (returns
   * `null`, logged once by the repository) so the cascade falls through to the
   * instance base. The one tolerant-branding entry point for the permalink / UPI area.
   */
  async loadBrandingOrNull(organizationId: string): Promise<Branding | null> {
    return this.brandingRepository.findOneByOrganizationIdOrNull(organizationId);
  }

  /**
   * The `{ url, source }` fallback base for an organization: the per-org branding
   * `permalinkBaseUrl` when present, else the instance base. When `organizationId`
   * is omitted the per-org override is skipped (instance base only).
   */
  async resolveFallbackBase(
    organizationId?: string,
  ): Promise<{ url: string; source: PermalinkFallbackBaseUrlSource }> {
    const branding = organizationId ? await this.loadBrandingOrNull(organizationId) : null;
    const envUrl = await this.getInstanceBaseUrl();
    return resolveFallbackBaseUrl(branding, envUrl);
  }

  /**
   * The resolved base URL (cascade `.url`) for assembling a passport's GS1
   * Digital Links / permalink fallbacks. Mirrors the retired `Gs1ResolverBaseService`.
   */
  async getResolverBase(organizationId?: string): Promise<string> {
    return (await this.resolveFallbackBase(organizationId)).url;
  }
}

/**
 * The branding → instance fallback base: the per-org branding `permalinkBaseUrl`
 * when set, else the canonicalised instance base. Pure; shared by
 * {@link BaseUrlResolver} and the permalink URL-rendering helpers.
 */
export function resolveFallbackBaseUrl(
  branding: Branding | null,
  fallbackEnvUrl: string,
): { url: string; source: PermalinkFallbackBaseUrlSource } {
  if (branding?.permalinkBaseUrl) {
    return { url: branding.permalinkBaseUrl, source: "branding" };
  }
  return { url: canonicaliseBaseUrl(fallbackEnvUrl), source: "instance" };
}
