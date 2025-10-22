import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationDbSchema, OrganizationDoc } from "../organizations/infrastructure/organization.schema";
import { OrganizationsModule } from "../organizations/organizations.module";
import { UniqueProductIdentifierModule } from "../unique-product-identifier/unique.product.identifier.module";
import { UsersModule } from "../users/users.module";
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
      {
        name: OrganizationDoc.name,
        schema: OrganizationDbSchema,
      },
    ]),
    UsersModule,
    OrganizationsModule,
    UniqueProductIdentifierModule,
  ],
  controllers: [PassportMetricController],
  providers: [PassportMetricService],
  exports: [PassportMetricService],
})
export class AnalyticsModule {}
