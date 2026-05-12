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
import { PresentationReferenceType } from "@open-dpp/dto";
import type { Request } from "express";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PermalinkApplicationService } from "../../permalink/application/services/permalink.application.service";
import { PermalinkRepository } from "../../permalink/infrastructure/permalink.repository";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { UniqueProductIdentifierRepository } from "../infrastructure/unique-product-identifier.repository";

@Controller()
export class UniqueProductIdentifierController {
  private readonly logger = new Logger(UniqueProductIdentifierController.name);

  constructor(
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly passportRepository: PassportRepository,
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly environmentService: EnvironmentService,
  ) {}

  @OptionalAuth()
  @Get("/unique-product-identifiers")
  @Redirect()
  async redirectByReference(@Query("reference") reference: string) {
    if (!reference) {
      throw new NotFoundException();
    }
    return {
      statusCode: HttpStatus.FOUND,
      url: `/p?passportId=${encodeURIComponent(reference)}`,
    };
  }

  @OptionalAuth()
  @Get("/unique-product-identifiers/:id")
  @Redirect()
  async redirectRoot(@Param("id") id: string) {
    const permalinkId = await this.resolvePermalinkId(id);
    return {
      statusCode: HttpStatus.FOUND,
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
      statusCode: HttpStatus.FOUND,
      url: `/p/${permalinkId}${suffix}`,
    };
  }

  private async resolvePermalinkId(upiUuid: string): Promise<string> {
    const upi = await this.uniqueProductIdentifierRepository.findOne(upiUuid);
    if (!upi) {
      throw new NotFoundException();
    }
    const passport = await this.passportRepository.findOne(upi.referenceId);
    if (!passport) {
      throw new NotFoundException();
    }

    const existingConfig = await this.presentationConfigurationRepository.findByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
    });
    if (existingConfig) {
      const existingPermalink = await this.permalinkRepository.findByPresentationConfigurationId(
        existingConfig.id,
      );
      if (existingPermalink) {
        return existingPermalink.id;
      }
    }

    return await this.environmentService.withTransaction(async (options) => {
      const permalink = await this.permalinkApplicationService.ensureDefaultForPassport(
        passport,
        options,
      );
      this.logger.debug(
        `Lazy-backfilled permalink for legacy UPI ${upiUuid} → passport ${passport.id} → permalink ${permalink.id}`,
      );
      return permalink.id;
    });
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
