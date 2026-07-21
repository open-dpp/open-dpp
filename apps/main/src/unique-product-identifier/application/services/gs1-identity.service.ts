import { Injectable, NotFoundException } from "@nestjs/common";
import {
  type Gs1IdentityResponse,
  PermalinkKind,
  UniqueProductIdentifierType,
} from "@open-dpp/dto";
import { BaseUrlResolver } from "../../../permalink/application/services/base-url-resolver.service";
import {
  PermalinkApplicationService,
  resolvePresentationViewUrl,
} from "../../../permalink/application/services/permalink.application.service";
import { PermalinkRepository } from "../../../permalink/infrastructure/permalink.repository";
import { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../../infrastructure/unique-product-identifier.repository";

/** The full assembled GS1 key a public resolver request carries. */
export interface Gs1KeyInput {
  gtin: string;
  batch?: string | null;
  serial?: string | null;
}

/**
 * Application service for a passport's GS1 identity.
 *
 * Owns the GS1 read path (return the newest-GS1-UPI identity plus the
 * server-assembled GS1 Digital Link, backing the kept GET /:id/gs1-identity)
 * and the public resolution path (turn a scanned full key into the passport's
 * permalink URL, publish-gated via the permalink).
 *
 * The write path (set/remove identity) has been retired to `UpiCollectionService`
 * (Slice 38). The resolver-base cascade is now owned by `BaseUrlResolver`.
 */
@Injectable()
export class Gs1IdentityService {
  constructor(
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly baseUrlResolver: BaseUrlResolver,
  ) {}

  /** Return a passport's GS1 identity, or null when it has none. */
  async getIdentity(
    passportId: string,
    organizationId?: string,
  ): Promise<Gs1IdentityResponse | null> {
    const upi = await this.uniqueProductIdentifierRepository.findByReferenceIdAndType(
      passportId,
      UniqueProductIdentifierType.GS1,
    );
    if (!upi) {
      return null;
    }
    return this.toResponse(upi, organizationId);
  }

  /**
   * Resolve a scanned full GS1 key (gtin + optional batch + optional serial) to
   * the passport's public permalink URL.
   *
   * Resolution order (per-UPI first, fallback to passport primary):
   * 1. Find the UPI by its exact GS1 key.
   * 2. Look up the UPI's own GS1-link permalink (if any).
   * 3. If the gs1-link permalink has a non-null `presentationConfigurationId`,
   *    redirect to THAT permalink's presentation view (its config's passport
   *    governs the publish gate).
   * 4. Otherwise (no gs1-link, or gs1-link has null config), fall back to the
   *    passport's PRIMARY presentation permalink.
   *
   * Publish-gating is inherited from whichever permalink is selected: an unpublished
   * passport (with anonymous access) makes `resolveToPassport` throw NotFound.
   *
   * @throws NotFoundException when no GS1 UPI carries the exact key, or when
   * neither a usable gs1-link config nor a passport primary exists.
   */
  async resolveGs1KeyToPublicUrl(key: Gs1KeyInput): Promise<string> {
    const upi = await this.uniqueProductIdentifierRepository.findByGs1Key({
      gtin: key.gtin,
      batch: key.batch ?? null,
      serial: key.serial ?? null,
    });
    if (!upi) {
      throw new NotFoundException(`No passport found for GS1 key ${JSON.stringify(key)}`);
    }

    // Step 2 & 3: Check for a gs1-link permalink with its own presentation config.
    const gs1LinkPermalink = await this.permalinkRepository.findGs1LinkByUpiId(upi.uuid);
    let targetPermalink =
      gs1LinkPermalink?.presentationConfigurationId != null ? gs1LinkPermalink : undefined;

    // Step 4: Fall back to the passport's primary presentation permalink when no
    // usable gs1-link config was found.
    if (!targetPermalink) {
      targetPermalink = await this.permalinkRepository.findPrimaryByPassportId(upi.referenceId);
    }

    if (!targetPermalink) {
      throw new NotFoundException(`No usable permalink found for GS1 key ${JSON.stringify(key)}`);
    }

    // Anonymous resolution: pass no access context so the permalink applies its
    // publish gate (unpublished → NotFound). The config's passport governs the gate
    // in the gs1-link-with-own-config branch.
    const { passport } = await this.permalinkApplicationService.resolveToPassport(
      targetPermalink.id,
      undefined,
    );
    const branding = await this.baseUrlResolver.loadBrandingOrNull(passport.organizationId);
    const fallbackEnvUrl = await this.permalinkApplicationService.getPermalinkBaseUrl();
    const { permalink: resolved, publicUrl } =
      await this.permalinkApplicationService.resolvePublicUrlWithFreeze(
        targetPermalink,
        passport,
        branding,
        fallbackEnvUrl,
      );
    if (resolved.kind === PermalinkKind.GS1_LINK) {
      // For a gs1-link the freeze/read publicUrl IS the scanned Digital Link —
      // returning it would 302 this resolver onto itself. The freeze call above
      // is kept for its lazy QR pinning (publishedUrl = the Digital Link form);
      // the redirect target is the permalink's presentation view, computed live
      // so old printed QR codes follow the org's current viewer base.
      return resolvePresentationViewUrl(resolved, branding, fallbackEnvUrl);
    }
    return publicUrl;
  }

  private async toResponse(
    upi: UniqueProductIdentifier,
    organizationId?: string,
  ): Promise<Gs1IdentityResponse> {
    const resolverBase = await this.baseUrlResolver.getResolverBase(organizationId);
    return upi.toGs1Response(resolverBase);
  }
}
