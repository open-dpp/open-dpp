import { Injectable } from "@nestjs/common";
import {
  CARRIER_EXPORT_CONTENT_TYPES,
  CarrierExportFormat,
  type CarrierExportFormatType,
  type CarrierExportQuery,
} from "@open-dpp/dto";
import { ForbiddenError, NotFoundError } from "@open-dpp/exception";
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
   * Membership is checked against the passport, never the request's organization header. Anyone
   * else gets a 403, like the passport endpoints. Permalinks are meant to be shared, so
   * confirming that one exists reveals nothing.
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
    if (!permalink || !passport) {
      throw new NotFoundError(`Permalink ${permalinkId} not found`);
    }
    if (!(await this.permalinkApplicationService.isMemberOfPassportOrg(passport, { userId }))) {
      throw new ForbiddenError(
        `Not a member of the organization that owns permalink ${permalinkId}`,
      );
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
      contentType: CARRIER_EXPORT_CONTENT_TYPES[settings.format],
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

function carrierExportFileName(permalink: Permalink, format: CarrierExportFormatType): string {
  return `data-carrier-${permalink.slug ?? permalink.id}.${format}`;
}
