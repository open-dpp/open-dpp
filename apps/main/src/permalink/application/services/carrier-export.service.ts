import { Injectable } from "@nestjs/common";
import type { CarrierExportQuery } from "@open-dpp/dto";
import { ForbiddenError, NotFoundError } from "@open-dpp/exception";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { type CarrierExport, DataCarrier } from "../../domain/data-carrier";
import { PermalinkRepository } from "../../infrastructure/permalink.repository";
import { BaseUrlResolver } from "./base-url-resolver.service";
import { PermalinkApplicationService } from "./permalink.application.service";

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
    const { publicUrl } =
      await this.permalinkApplicationService.resolvePublicUrlAndFreezeIfPublished(
        permalink,
        passport,
        await this.baseUrlResolver.loadBrandingOrNull(passport.organizationId),
        await this.permalinkApplicationService.getPermalinkBaseUrl(),
      );
    const carrier = DataCarrier.encode(publicUrl, settings.errorCorrection);
    return await carrier.export(settings, permalink.slug ?? permalink.id);
  }
}
