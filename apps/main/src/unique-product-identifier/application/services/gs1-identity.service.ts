import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { canonicaliseBaseUrl, Gs1IdentityResponse } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { Branding } from "../../../branding/domain/branding";
import { InstanceSettingsService } from "../../../instance-settings/application/services/instance-settings.service";
import { PermalinkApplicationService } from "../../../permalink/application/services/permalink.application.service";
import { PermalinkRepository } from "../../../permalink/infrastructure/permalink.repository";
import {
  type Gs1IdentityInput,
  UniqueProductIdentifier,
} from "../../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../../infrastructure/unique-product-identifier.repository";
import { ExternalIdentifierType } from "../../presentation/dto/unique-product-identifier-dto.schema";

/** The full assembled GS1 key a public resolver request carries. */
export interface Gs1KeyInput {
  gtin: string;
  batch?: string | null;
  serial?: string | null;
}

/**
 * Application service for a passport's GS1 identity.
 *
 * Owns the GS1 write path (set the identity — GTIN normalized to GTIN-14 plus an
 * optional batch/serial), the read path (return the identity plus the
 * server-assembled GS1 Digital Link), and the public resolution path (turn a
 * scanned full key into the passport's permalink URL, publish-gated via the
 * permalink).
 */
@Injectable()
export class Gs1IdentityService {
  private readonly logger = new Logger(Gs1IdentityService.name);

  constructor(
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly permalinkRepository: PermalinkRepository,
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

  /**
   * Set (create or replace) a passport's GS1 identity from raw input: a GTIN plus
   * an optional batch / serial. Omitting batch / serial clears them.
   *
   * Goes through the domain entity so the GTIN is mod-10 validated and normalized
   * to GTIN-14 and the batch/serial are CSET-82/length validated, then persists
   * via the repository (never a field-level $set of domain state).
   */
  async setIdentity(
    passportId: string,
    input: Omit<Gs1IdentityInput, "gtin"> & { gtin: string },
    organizationId?: string,
  ): Promise<Gs1IdentityResponse> {
    const existing = await this.uniqueProductIdentifierRepository.findByReferenceIdAndType(
      passportId,
      ExternalIdentifierType.GS1,
    );
    const next = existing
      ? existing.withGs1(input)
      : UniqueProductIdentifier.createGs1({ referenceId: passportId, ...input });
    const saved = await this.uniqueProductIdentifierRepository.save(next);
    return this.toResponse(saved, organizationId);
  }

  /** Return a passport's GS1 identity, or null when it has none. */
  async getIdentity(
    passportId: string,
    organizationId?: string,
  ): Promise<Gs1IdentityResponse | null> {
    const upi = await this.uniqueProductIdentifierRepository.findByReferenceIdAndType(
      passportId,
      ExternalIdentifierType.GS1,
    );
    if (!upi) {
      return null;
    }
    return this.toResponse(upi, organizationId);
  }

  /**
   * Remove a passport's GS1 identity.
   *
   * Type-filtered to the `GS1` row so the canonical `OPEN_DPP_UUID` UPI (media,
   * downloads, AI chat) is never affected. Removing a passport without a GS1
   * identity is a no-op (idempotent); the controller surfaces "nothing to remove"
   * as a 404 by checking for the identity first.
   */
  async removeIdentity(passportId: string): Promise<void> {
    await this.uniqueProductIdentifierRepository.deleteByReferenceIdAndType(
      passportId,
      ExternalIdentifierType.GS1,
    );
  }

  /**
   * Resolve a scanned full GS1 key (gtin + optional batch + optional serial) to
   * the passport's public permalink URL.
   *
   * Publish-gating and branding are inherited from the permalink: an unpublished
   * passport (with anonymous access) makes `resolveToPassport` throw NotFound.
   *
   * @throws NotFoundException when no GS1 UPI carries the exact key or the passport
   * has no permalink.
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
    const permalinks = await this.permalinkRepository.findAllByPassportId(upi.referenceId);
    const permalink = permalinks[0];
    if (!permalink) {
      throw new NotFoundException(`No permalink found for passport ${upi.referenceId}`);
    }
    // Anonymous resolution: pass no access context so the permalink applies its
    // publish gate (unpublished → NotFound).
    const { passport } = await this.permalinkApplicationService.resolveToPassport(
      permalink.id,
      undefined,
    );
    const branding = await this.loadBrandingForPin(passport.organizationId);
    const fallbackEnvUrl = await this.permalinkApplicationService.getPermalinkBaseUrl();
    const { publicUrl } = await this.permalinkApplicationService.resolvePublicUrlWithFreeze(
      permalink,
      passport,
      branding,
      fallbackEnvUrl,
    );
    return publicUrl;
  }

  /**
   * Load branding for URL pinning, tolerating a missing branding row: on failure
   * return null so the public URL is computed without freezing (mirrors the
   * permalink controller's resilient branding load).
   */
  private async loadBrandingForPin(organizationId: string): Promise<Branding | null> {
    try {
      return await this.permalinkApplicationService.loadBranding(organizationId);
    } catch (error) {
      this.logger.warn(
        `Branding load failed for organizationId=${organizationId}; resolving GS1 link without permalink pinning`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  private async toResponse(
    upi: UniqueProductIdentifier,
    organizationId?: string,
  ): Promise<Gs1IdentityResponse> {
    const resolverBase = await this.getResolverBase(organizationId);
    return {
      uuid: upi.uuid,
      referenceId: upi.referenceId,
      gtin: upi.gs1!.gtin,
      batch: upi.gs1!.batch ?? null,
      serial: upi.gs1!.serial ?? null,
      digitalLink: upi.buildDigitalLink(resolverBase),
    };
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
