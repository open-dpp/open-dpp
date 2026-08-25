import { Injectable } from "@nestjs/common";
import { canonicaliseBaseUrl, PermalinkFallbackBaseUrlSource } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { Branding } from "../../../branding/domain/branding";
import { BrandingRepository } from "../../../branding/infrastructure/branding.repository";
import { InstanceSettingsService } from "../../../instance-settings/application/services/instance-settings.service";
import { computePermalinkBaseUrlFallback } from "../../../lib/permalink-fallback";

@Injectable()
export class BaseUrlResolver {
  constructor(
    private readonly brandingRepository: BrandingRepository,
    private readonly envService: EnvService,
    private readonly instanceSettingsService: InstanceSettingsService,
  ) {}

  async getInstanceBaseUrl(): Promise<string> {
    const settings = await this.instanceSettingsService.getSettings();
    if (settings.permalinkBaseUrl.value !== null) {
      return settings.permalinkBaseUrl.value;
    }
    return computePermalinkBaseUrlFallback(this.envService.get("OPEN_DPP_URL"));
  }

  async loadBrandingOrNull(organizationId: string): Promise<Branding | null> {
    return this.brandingRepository.findOneByOrganizationIdOrNull(organizationId);
  }

  async resolveFallbackBase(
    organizationId?: string,
  ): Promise<{ url: string; source: PermalinkFallbackBaseUrlSource }> {
    const branding = organizationId ? await this.loadBrandingOrNull(organizationId) : null;
    const envUrl = await this.getInstanceBaseUrl();
    return resolveFallbackBaseUrl(branding, envUrl);
  }

  async getResolverBase(organizationId?: string): Promise<string> {
    return (await this.resolveFallbackBase(organizationId)).url;
  }
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
