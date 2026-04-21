import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasModule } from "../aas/aas.module";

import { BrandingModule } from "../branding/branding.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { UsersModule } from "../identity/users/users.module";
import { PassportsModule } from "../passports/passports.module";
import { PermalinkModule } from "../permalink/permalink.module";
import { PresentationConfigurationsModule } from "../presentation-configurations/presentation-configurations.module";
import { TraceabilityEventsModule } from "../traceability-events/traceability-events.module";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "./infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "./infrastructure/unique-product-identifier.service";
import { UniqueProductIdentifierApplicationService } from "./presentation/unique.product.identifier.application.service";
import { UniqueProductIdentifierController } from "./presentation/unique.product.identifier.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UniqueProductIdentifierDoc.name,
        schema: UniqueProductIdentifierSchema,
      },
    ]),
    AasModule,
    OrganizationsModule,
    UsersModule,
    TraceabilityEventsModule,
    PassportsModule,
    BrandingModule,
    PresentationConfigurationsModule,
    PermalinkModule,
  ],
  controllers: [UniqueProductIdentifierController],
  providers: [UniqueProductIdentifierApplicationService, UniqueProductIdentifierService],
  exports: [UniqueProductIdentifierService, UniqueProductIdentifierApplicationService],
})
export class UniqueProductIdentifierModule {}
