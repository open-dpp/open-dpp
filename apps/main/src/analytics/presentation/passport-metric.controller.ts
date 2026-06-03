import type { PassportPageViewDto } from "@open-dpp/dto";
import { Body, Controller, Get, Headers, Logger, Post, Query } from "@nestjs/common";
import { PassportPageViewSchema } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import {
  ORGANIZATION_ID_HEADER,
  OrganizationId,
} from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { PermalinkApplicationService } from "../../permalink/application/services/permalink.application.service";
import { PassportMetric } from "../domain/passport-metric";
import { PassportMetricService } from "../infrastructure/passport-metric.service";
import { PassportMetricQuerySchema } from "./dto/passport-metric-query.dto";

@Controller()
export class PassportMetricController {
  private readonly logger = new Logger(PassportMetricController.name);

  constructor(
    private passportMetricService: PassportMetricService,
    private permalinkApplicationService: PermalinkApplicationService,
  ) {}

  @OptionalAuth()
  @Post("/passport-metrics/page-views")
  async handlePassportPageViewed(
    @Body(new ZodValidationPipe(PassportPageViewSchema))
    passportPageViewDto: PassportPageViewDto,
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    const passportMetadata = await this.permalinkApplicationService.getMetadataByPermalink(
      passportPageViewDto.permalink,
      { organizationId, memberRole },
    );

    const passportMetric = PassportMetric.createPageView({
      source: {
        organizationId: passportMetadata.organizationId,
        passportId: passportMetadata.passportId,
        templateId: passportMetadata.templateId ?? null,
      },
      date: new Date(Date.now()),
      page: passportPageViewDto.page,
    });
    const { id } = await this.passportMetricService.create(passportMetric);

    return {
      id,
    };
  }

  @Get("/passport-metrics")
  async getPassportMetric(
    @OrganizationId() organizationId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("templateId") templateId: string | undefined,
    @Query("passportId") passportId: string,
    @Query("type") type: string,
    @Query("valueKey") valueKey: string,
    @Query("period") period: string,
    @Query("timezone") timezone: string,
  ) {
    const query = PassportMetricQuerySchema.parse({
      startDate,
      endDate,
      templateId,
      passportId,
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
    return this.passportMetricService.computeStatistic(organizationId, query);
  }
}
