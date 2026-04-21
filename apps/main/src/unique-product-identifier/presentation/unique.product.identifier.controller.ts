import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Query,
  Redirect,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import { PermalinkRepository } from "../../permalink/infrastructure/permalink.repository";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { UniqueProductIdentifierRepository } from "../infrastructure/unique-product-identifier.repository";

/**
 * Legacy redirect surface. The public UPI endpoints moved to /p/:idOrSlug/*.
 * These routes 301 to the new permalink URLs for one release cycle so that
 * already-printed QR codes and bookmarks keep working. Follow-up issue:
 * remove after the deprecation window closes.
 */
@Controller()
export class UniqueProductIdentifierController {
  private readonly logger = new Logger(UniqueProductIdentifierController.name);

  constructor(
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    private readonly permalinkRepository: PermalinkRepository,
  ) {}

  @OptionalAuth()
  @Get("/unique-product-identifiers")
  @Redirect()
  async redirectByReference(@Query("reference") reference: string) {
    if (!reference) {
      throw new NotFoundException();
    }
    return {
      statusCode: HttpStatus.MOVED_PERMANENTLY,
      url: `/p?passportId=${encodeURIComponent(reference)}`,
    };
  }

  @OptionalAuth()
  @Get("/unique-product-identifiers/:id")
  @Redirect()
  async redirectRoot(@Param("id") id: string) {
    const permalinkId = await this.resolvePermalinkId(id);
    return {
      statusCode: HttpStatus.MOVED_PERMANENTLY,
      url: `/p/${permalinkId}`,
    };
  }

  @OptionalAuth()
  @Get("/unique-product-identifiers/:id/*rest")
  @Redirect()
  async redirectCatchAll(@Param("id") id: string, @Req() req: Request) {
    const permalinkId = await this.resolvePermalinkId(id);
    const [prefix, suffix] = splitOnUpiSegment(req.originalUrl || req.url, id);
    this.logger.debug(
      `Redirecting legacy UPI URL prefix=${prefix} → permalink=${permalinkId} suffix=${suffix}`,
    );
    return {
      statusCode: HttpStatus.MOVED_PERMANENTLY,
      url: `/p/${permalinkId}${suffix}`,
    };
  }

  private async resolvePermalinkId(upiUuid: string): Promise<string> {
    const upi = await this.uniqueProductIdentifierRepository.findOne(upiUuid);
    if (!upi) {
      throw new NotFoundException();
    }
    const config = await this.presentationConfigurationRepository.findByReference({
      referenceType: "passport",
      referenceId: upi.referenceId,
    });
    if (!config) {
      throw new NotFoundException();
    }
    const permalink = await this.permalinkRepository.findByPresentationConfigurationId(config.id);
    if (!permalink) {
      throw new NotFoundException();
    }
    return permalink.id;
  }
}

function splitOnUpiSegment(path: string, upiId: string): [string, string] {
  const marker = `/unique-product-identifiers/${upiId}`;
  const idx = path.indexOf(marker);
  if (idx === -1) {
    return [path, ""];
  }
  const afterId = path.slice(idx + marker.length);
  return [path.slice(0, idx + marker.length), afterId];
}
