import { Injectable, Logger } from "@nestjs/common";
import { Branding } from "../../../branding/domain/branding";
import {
  PermalinkApplicationService,
  resolveFallbackBaseUrl,
} from "../../../permalink/application/services/permalink.application.service";

/**
 * Shared service for resolving the GS1 Digital Link resolver base URL.
 *
 * Per ADR 0004 there is no separate "GS1 resolver base" concept: a passport's
 * GS1 Digital Links are assembled from the SAME org/instance base used for
 * permalinks. The resolver base is therefore the value yielded by
 * {@link resolveFallbackBaseUrl}:
 *
 *   branding.permalinkBaseUrl ?? canonicalised instance base (OPEN_DPP_URL)
 *
 * The instance base already folds in the `OPEN_DPP_PERMALINK_BASE_URL` env
 * override and the `permalinkBaseUrl` instance setting via
 * {@link PermalinkApplicationService.getPermalinkBaseUrl}. The resolved value is
 * canonicalised (host lowercased, trailing slash dropped). When `organizationId`
 * is omitted, the per-org branding override is skipped.
 */
@Injectable()
export class Gs1ResolverBaseService {
  private readonly logger = new Logger(Gs1ResolverBaseService.name);

  constructor(private readonly permalinkApplicationService: PermalinkApplicationService) {}

  /**
   * Resolve the org/instance base for assembling a passport's Digital Links:
   * per-organization branding `permalinkBaseUrl` → canonicalised instance base.
   * Mirrors `resolveFallbackBaseUrl` in the permalink application service.
   */
  async getResolverBase(organizationId?: string): Promise<string> {
    const branding = organizationId ? await this.loadBranding(organizationId) : null;
    const envUrl = await this.permalinkApplicationService.getPermalinkBaseUrl();
    return resolveFallbackBaseUrl(branding, envUrl).url;
  }

  /**
   * Load an organization's branding, tolerating a missing branding row (returns
   * null so the cascade falls through to the instance base).
   */
  private async loadBranding(organizationId: string): Promise<Branding | null> {
    try {
      return await this.permalinkApplicationService.loadBranding(organizationId);
    } catch (error) {
      this.logger.warn(
        `Branding load failed for organizationId=${organizationId}; resolving GS1 base without the per-org override`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }
}
