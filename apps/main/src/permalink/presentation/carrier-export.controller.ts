import { Controller, Get, Param, Query, StreamableFile, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AllApiVersions, type CarrierExportQuery, CarrierExportQuerySchema } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { UserOrIpThrottlerGuard } from "../../common/throttler/user-or-ip.throttler-guard";
import { UserIdDecorator } from "../../identity/auth/presentation/decorators/user-id.decorator";
import { CarrierExportService } from "../application/services/carrier-export.service";

/** Exports per user and minute; each one renders an image of up to 6000 px per side. */
export const CARRIER_EXPORT_RATE_LIMIT = { limit: 60, ttl: 60_000 } as const;

@Controller({ version: AllApiVersions })
export class CarrierExportController {
  constructor(private readonly carrierExportService: CarrierExportService) {}

  /** The Carrier Export (SVG or PNG) of one permalink, for Members of the passport's organization. */
  @Get("/permalinks/:id/carrier")
  @UseGuards(UserOrIpThrottlerGuard)
  @Throttle({ default: CARRIER_EXPORT_RATE_LIMIT })
  async getCarrierExport(
    @Param("id") id: string,
    @Query(new ZodValidationPipe(CarrierExportQuerySchema)) settings: CarrierExportQuery,
    @UserIdDecorator() userId: string,
  ): Promise<StreamableFile> {
    const carrierExport = await this.carrierExportService.exportForMember(id, userId, settings);
    return new StreamableFile(carrierExport.content, {
      type: carrierExport.contentType,
      disposition: `attachment; filename="${carrierExport.fileName}"`,
    });
  }
}
