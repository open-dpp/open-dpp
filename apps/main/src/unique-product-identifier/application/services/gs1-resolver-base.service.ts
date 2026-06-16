import { Injectable, Logger } from "@nestjs/common";
import { canonicaliseBaseUrl } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { InstanceSettingsService } from "../../../instance-settings/application/services/instance-settings.service";
import { PermalinkApplicationService } from "../../../permalink/application/services/permalink.application.service";

/**
 * Shared service for resolving the GS1 Digital Link resolver base URL.
 *
 * Extracted from `Gs1IdentityService.getResolverBase` so it can be consumed by
 * both `Gs1IdentityService` (Slice 38) and `UpiCollectionService` (Slice 32)
 * without circular dependencies or code duplication.
 *
 * Resolution cascade (per-org override beats instance setting beats env URL):
 * 1. Per-organization branding `gs1ResolverBaseUrl` (if `organizationId` provided)
 * 2. Instance-level `gs1ResolverBaseUrl` setting (already env-overridden)
 * 3. Default: canonicalised `OPEN_DPP_URL` bare root
 *
 * Each resolved value is canonicalised (host lowercased, trailing slash dropped).
 * A blank override is treated as absent.
 */
@Injectable()
export class Gs1ResolverBaseService {
  private readonly logger = new Logger(Gs1ResolverBaseService.name);

  constructor(
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly envService: EnvService,
    private readonly instanceSettingsService: InstanceSettingsService,
  ) {}

  /**
   * Resolve the GS1 resolver base for assembling a passport's Digital Links via
   * the cascade: per-organization branding override → instance-level setting →
   * default (the canonicalised instance root `OPEN_DPP_URL`, bare — NOT the
   * permalink `/p` base).
   *
   * The instance setting already folds in its env override (`OPEN_DPP_GS1_RESOLVER_BASE_URL`)
   * via {@link InstanceSettingsService}. The resolved value is canonicalised
   * (host lowercased, trailing slash dropped). A blank override is treated as
   * absent. When `organizationId` is omitted, the per-org override is skipped.
   */
  async getResolverBase(organizationId?: string): Promise<string> {
    const orgOverride = organizationId ? await this.loadOrgResolverOverride(organizationId) : null;
    if (orgOverride) {
      return canonicaliseBaseUrl(orgOverride);
    }
    const instanceSetting = await this.loadInstanceResolverSetting();
    if (instanceSetting) {
      return canonicaliseBaseUrl(instanceSetting);
    }
    return canonicaliseBaseUrl(this.envService.get("OPEN_DPP_URL"));
  }

  /**
   * Load an organization's GS1 resolver override from its branding, tolerating a
   * missing branding row (returns null so the cascade falls through). A blank
   * value is treated as absent.
   */
  private async loadOrgResolverOverride(organizationId: string): Promise<string | null> {
    try {
      const branding = await this.permalinkApplicationService.loadBranding(organizationId);
      return nonBlankOrNull(branding.gs1ResolverBaseUrl);
    } catch (error) {
      this.logger.warn(
        `Branding load failed for organizationId=${organizationId}; resolving GS1 base without the per-org override`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  /** Load the instance-level GS1 resolver setting (already env-overridden). */
  private async loadInstanceResolverSetting(): Promise<string | null> {
    const settings = await this.instanceSettingsService.getSettings();
    return nonBlankOrNull(settings.gs1ResolverBaseUrl.value);
  }
}

/** Trim a nullable string, returning null for empty/blank values. */
function nonBlankOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
