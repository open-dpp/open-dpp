import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportMetricController } from './presentation/passport-metric.controller';
import { PassportMetricService } from './infrastructure/passport-metric.service';
import {
  PassportMetricDoc,
  PassportMetricSchema,
} from './infrastructure/passport-metric.schema';
import { ConfigModule } from '@nestjs/config';
import { PermissionModule } from '@app/permission';
import { PassportMetadataModule } from '@app/passport-metadata';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: PassportMetricDoc.name,
        schema: PassportMetricSchema,
      },
    ]),
    PermissionModule,
    PassportMetadataModule,
  ],
  controllers: [PassportMetricController],
  providers: [PassportMetricService],
  exports: [PassportMetricService],
})
export class PassportMetricModule {}
