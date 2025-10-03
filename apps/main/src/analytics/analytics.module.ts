import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportMetricController } from './presentation/passport-metric.controller';
import { PassportMetricService } from './infrastructure/passport-metric.service';
import {
  PassportMetricDoc,
  PassportMetricSchema,
} from './infrastructure/passport-metric.schema';
import { PermissionModule } from '@app/permission';
import { UniqueProductIdentifierModule } from '../unique-product-identifier/unique.product.identifier.module';
import { UniqueProductIdentifierApplicationService } from '../unique-product-identifier/presentation/unique.product.identifier.application.service';
import { ModelsService } from '../models/infrastructure/models.service';
import { ItemsService } from '../items/infrastructure/items.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PassportMetricDoc.name,
        schema: PassportMetricSchema,
      },
    ]),
    PermissionModule,
    UniqueProductIdentifierModule,
  ],
  controllers: [PassportMetricController],
  providers: [PassportMetricService],
  exports: [PassportMetricService],
})
export class AnalyticsModule {}
