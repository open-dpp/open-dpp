import { Injectable, NotFoundException } from "@nestjs/common";
import { type Gs1IdentityResponse, UniqueProductIdentifierType } from "@open-dpp/dto";
import { BaseUrlResolver } from "../../../permalink/application/services/base-url-resolver.service";
import {
  PermalinkApplicationService,
  resolvePresentationViewUrl,
} from "../../../permalink/application/services/permalink.application.service";
import { PermalinkRepository } from "../../../permalink/infrastructure/permalink.repository";
import { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../../infrastructure/unique-product-identifier.repository";

export interface Gs1KeyInput {
  gtin: string;
  batch?: string | null;
  serial?: string | null;
}

@Injectable()
export class Gs1IdentityService {
  constructor(
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly baseUrlResolver: BaseUrlResolver,
  ) {}

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

  async resolveGs1KeyToPublicUrl(key: Gs1KeyInput): Promise<string> {
    const upi = await this.uniqueProductIdentifierRepository.findByGs1Key({
      gtin: key.gtin,
      batch: key.batch ?? null,
      serial: key.serial ?? null,
    });
    if (!upi) {
      throw new NotFoundException(`No passport found for GS1 key ${JSON.stringify(key)}`);
    }

    const gs1LinkPermalink = await this.permalinkRepository.findGs1LinkByUpiId(upi.uuid);
    if (!gs1LinkPermalink) {
      throw new NotFoundException(`No usable permalink found for GS1 key ${JSON.stringify(key)}`);
    }

    const { passport } = await this.permalinkApplicationService.resolveToPassport(
      gs1LinkPermalink.id,
      undefined,
    );
    const branding = await this.baseUrlResolver.loadBrandingOrNull(passport.organizationId);
    const fallbackEnvUrl = await this.permalinkApplicationService.getPermalinkBaseUrl();
    const { permalink: resolved } =
      await this.permalinkApplicationService.resolvePublicUrlWithFreeze(
        gs1LinkPermalink,
        passport,
        branding,
        fallbackEnvUrl,
      );
    return resolvePresentationViewUrl(resolved, branding, fallbackEnvUrl);
  }

  private async toResponse(
    upi: UniqueProductIdentifier,
    organizationId?: string,
  ): Promise<Gs1IdentityResponse> {
    const resolverBase = await this.baseUrlResolver.getResolverBase(organizationId);
    return upi.toGs1Response(resolverBase);
  }
}
