import { Controller, Get, Param, Query, StreamableFile } from "@nestjs/common";
import { AllApiVersions, type CarrierExportQuery, CarrierExportQuerySchema } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import type { Session } from "../../identity/auth/domain/session";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { CarrierExportService } from "../application/services/carrier-export.service";

@Controller({ version: AllApiVersions })
export class CarrierExportController {
  constructor(private readonly carrierExportService: CarrierExportService) {}

  /** The Carrier Export (SVG or PNG) of one permalink, for Members of the passport's organization. */
  @Get("/permalinks/:id/carrier")
  async getCarrierExport(
    @Param("id") id: string,
    @Query(new ZodValidationPipe(CarrierExportQuerySchema)) settings: CarrierExportQuery,
    @AuthSession() session: Session,
  ): Promise<StreamableFile> {
    const carrierExport = await this.carrierExportService.exportForMember(
      id,
      session.userId,
      settings,
    );
    return new StreamableFile(carrierExport.content, {
      type: carrierExport.contentType,
      disposition: `attachment; filename="${carrierExport.fileName}"`,
    });
  }
}
