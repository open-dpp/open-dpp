import { PassportMetricService } from '../infrastructure/passport-metric.service';
import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { PassportPageViewSchema } from './dto/passport-page-view.dto';
import type { PassportPageViewDto } from './dto/passport-page-view.dto';
import { PassportMetricQuerySchema } from './dto/passport-metric-query.dto';
import { PassportMetricAggregation } from '../domain/passport-metric-aggregation';
import { PassportMetric } from '../domain/passport-metric';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  ItemUpdateEventDto,
  ItemUpdateEventSchema,
} from './dto/item-update-event.dto';
import { UniqueProductIdentifierApplicationService } from '../../unique-product-identifier/presentation/unique.product.identifier.application.service';
import { PermissionService } from '@app/permission';
import { Public } from '@app/auth/public/public.decorator';
import { ZodValidationPipe } from '@app/exception/zod-validation.pipeline';

@Controller()
export class PassportMetricController {
  private readonly logger = new Logger(PassportMetricController.name);

  constructor(
    private passportMetricService: PassportMetricService,
    private uniqueProductIdentifierApplicationService: UniqueProductIdentifierApplicationService,
    private readonly permissionsService: PermissionService,
  ) {}

  //
  // @EventPattern('item_updated')
  // async handleItemUpdated(
  //   @Payload()
  //   data: ItemUpdateEventDto,
  // ) {
  //   this.logger.log('Start processing item update event');
  //   const parsedData = ItemUpdateEventSchema.parse(data);
  //   const passportMetric = PassportMetric.createFieldAggregate({
  //     source: {
  //       templateId: parsedData.templateId,
  //       organizationId: parsedData.organizationId,
  //       modelId: parsedData.modelId,
  //     },
  //     date: new Date(parsedData.date),
  //     fieldValues: parsedData.fieldValues,
  //   });
  //   this.logger.log(
  //     `Created passport metric ${JSON.stringify(passportMetric)}`,
  //   );
  //
  //   await this.passportMetricService.create(passportMetric);
  //   this.logger.log(`End processing item update event`);
  //   return {
  //     id: passportMetric.id,
  //   };
  // }

  @Public()
  @Post('/passport-metrics/page-views')
  async handlePassportPageViewed(
    @Body(new ZodValidationPipe(PassportPageViewSchema))
    passportPageViewDto: PassportPageViewDto,
  ) {
    const passportMetadata =
      await this.uniqueProductIdentifierApplicationService.getMetadataByUniqueProductIdentifier(
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
      id: id,
    };
  }

  // @Get('/organizations/:organizationId/passport-metrics')
  // async getPassportMetric(
  //   @Param('organizationId') organizationId: string,
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  //   @Query('templateId') templateId: string,
  //   @Query('modelId') modelId: string,
  //   @Query('type') type: string,
  //   @Query('valueKey') valueKey: string,
  //   @Query('period') period: string,
  //   @Request() req: AuthRequest,
  // ) {
  //   const query = PassportMetricQuerySchema.parse({
  //     startDate,
  //     endDate,
  //     templateId,
  //     modelId,
  //     type,
  //     valueKey,
  //     period,
  //   });
  //   this.logger.log(
  //     `Start processing passport metric query for organization ${organizationId} with query ${JSON.stringify(
  //       query,
  //     )}`,
  //   );
  //   await this.permissionsService.canAccessOrganizationOrFail(
  //     organizationId,
  //     req.authContext,
  //   );
  //   return this.passportMetricService.computeStatistic(
  //     PassportMetricAggregation.create({ ...query, organizationId }),
  //     query.period,
  //   );
  // }
}
