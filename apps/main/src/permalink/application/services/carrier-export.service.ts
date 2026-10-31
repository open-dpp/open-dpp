import { Injectable, NotFoundException } from "@nestjs/common";
import { CarrierExportFormat, type CarrierExportQuery } from "@open-dpp/dto";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { DataCarrier } from "../../domain/data-carrier";
import { Permalink } from "../../domain/permalink";
import { renderCarrierPng, renderCarrierSvg } from "../../infrastructure/carrier-export.renderer";
import { PermalinkRepository } from "../../infrastructure/permalink.repository";
import { BaseUrlResolver } from "./base-url-resolver.service";
import { PermalinkApplicationService } from "./permalink.application.service";

export interface CarrierExport {
  content: Buffer;
  contentType: string;
  fileName: string;
}

const CONTENT_TYPES = {
  [CarrierExportFormat.SVG]: "image/svg+xml",
  [CarrierExportFormat.PNG]: "image/png",
} as const;

@Injectable()
export class CarrierExportService {
  constructor(
    private readonly permalinkRepository: PermalinkRepository,
    private readonly passportRepository: PassportRepository,
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly baseUrlResolver: BaseUrlResolver,
  ) {}

  /**
   * The Carrier Export of one permalink for a Member of the organization that owns its passport.
   * Membership is checked against the passport, never the request's organization header; anyone
   * else learns nothing and gets the same 404 as for an unknown permalink.
   */
  async exportForMember(
    permalinkId: string,
    userId: string,
    settings: CarrierExportQuery,
  ): Promise<CarrierExport> {
    const permalink = await this.permalinkRepository.findOne(permalinkId);
    const passport = permalink
      ? await this.passportRepository.findOne(permalink.passportId)
      : undefined;
    if (
      !permalink ||
      !passport ||
      !(await this.permalinkApplicationService.isMemberOfPassportOrg(passport, { userId }))
    ) {
      throw new NotFoundException(`Permalink ${permalinkId} not found`);
    }
    // the same URL the back-office reads show, frozen once the passport is published
    const { publicUrl } = await this.permalinkApplicationService.resolvePublicUrlWithFreeze(
      permalink,
      passport,
      await this.baseUrlResolver.loadBrandingOrNull(passport.organizationId),
      await this.permalinkApplicationService.getPermalinkBaseUrl(),
    );
    const carrier = DataCarrier.encode(publicUrl, settings.errorCorrection);
    return {
      content: await this.render(carrier, settings),
      contentType: CONTENT_TYPES[settings.format],
      fileName: carrierExportFileName(permalink, settings.format),
    };
  }

  private async render(carrier: DataCarrier, settings: CarrierExportQuery): Promise<Buffer> {
    if (settings.format === CarrierExportFormat.PNG) {
      return await renderCarrierPng(carrier, settings.moduleSize, settings.dpi);
    }
    return Buffer.from(renderCarrierSvg(carrier, settings.moduleSize), "utf8");
  }
}

function carrierExportFileName(permalink: Permalink, format: string): string {
  return `data-carrier-${permalink.slug ?? permalink.id}.${format}`;
}
