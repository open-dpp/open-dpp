import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PermissionModule } from "@open-dpp/auth";
import { UniqueProductIdentifierModule } from "../unique-product-identifier/unique.product.identifier.module";
import { PassportMetricDoc, PassportMetricSchema } from "./infrastructure/passport-metric.schema";
import { PassportMetricService } from "./infrastructure/passport-metric.service";
import { PassportMetricController } from "./presentation/passport-metric.controller";

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
