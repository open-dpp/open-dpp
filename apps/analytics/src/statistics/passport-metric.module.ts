import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportMetricController } from './presentation/passport-metric.controller';
import { PassportMetricService } from './infrastructure/passport-metric.service';
import {
  PassportMetricDoc,
  PassportMetricSchema,
} from './infrastructure/passport-metric.schema';
import { PassportModule } from '../passports/passport.module';
import { ConfigModule } from '@nestjs/config';
import { PermissionModule } from '@app/permission';

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
    PassportModule,
  ],
  controllers: [PassportMetricController],
  providers: [PassportMetricService],
  exports: [PassportMetricService],
})
export class PassportMetricModule {}
