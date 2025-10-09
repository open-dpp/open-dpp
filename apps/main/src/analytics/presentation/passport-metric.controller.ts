import type { PassportPageViewDto } from "./dto/passport-page-view.dto";

import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Request,
} from "@nestjs/common";
import { AuthRequest, PermissionService, Public } from "@open-dpp/auth";
import { ZodValidationPipe } from "@open-dpp/exception";
import { UniqueProductIdentifierApplicationService } from "../../unique-product-identifier/presentation/unique.product.identifier.application.service";
import { PassportMetric } from "../domain/passport-metric";
import { PassportMetricAggregation } from "../domain/passport-metric-aggregation";
import { PassportMetricService } from "../infrastructure/passport-metric.service";
import { PassportMetricQuerySchema } from "./dto/passport-metric-query.dto";
import { PassportPageViewSchema } from "./dto/passport-page-view.dto";

@Controller()
export class PassportMetricController {
  private readonly logger = new Logger(PassportMetricController.name);

  constructor(
    private passportMetricService: PassportMetricService,
    private uniqueProductIdentifierApplicationService: UniqueProductIdentifierApplicationService,
    private readonly permissionsService: PermissionService,
  ) {}

  @Public()
  @Post("/passport-metrics/page-views")
  async handlePassportPageViewed(
    @Body(new ZodValidationPipe(PassportPageViewSchema))
    passportPageViewDto: PassportPageViewDto,
  ) {
    const passportMetadata
      = await this.uniqueProductIdentifierApplicationService.getMetadataByUniqueProductIdentifier(
        passportPageViewDto.uuid,
      );

    const passportMetric = PassportMetric.createPageView({
      source: {
        templateId: passportMetadata.templateId,
        organizationId: passportMetadata.organizationId,
        modelId: passportMetadata.modelId,
      },
      date: new Date(Date.now()),
      page: passportPageViewDto.page,
    });
    const { id } = await this.passportMetricService.create(passportMetric);

    return {
      id,
    };
  }

  @Get("/organizations/:organizationId/passport-metrics")
  async getPassportMetric(
    @Param("organizationId") organizationId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("templateId") templateId: string,
    @Query("modelId") modelId: string,
    @Query("type") type: string,
    @Query("valueKey") valueKey: string,
    @Query("period") period: string,
    @Query("timezone") timezone: string,
    @Request() req: AuthRequest,
  ) {
    const query = PassportMetricQuerySchema.parse({
      startDate,
      endDate,
      templateId,
      modelId,
      type,
      valueKey,
      period,
      timezone,
    });
    this.logger.log(
      `Start processing passport metric query for organization ${organizationId} with query ${JSON.stringify(
        query,
      )}`,
    );
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    return this.passportMetricService.computeStatistic(
      PassportMetricAggregation.create({ ...query, organizationId }),
      query.period,
    );
  }
}
