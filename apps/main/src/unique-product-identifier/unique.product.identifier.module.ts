import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasModule } from "../aas/aas.module";

import { BrandingModule } from "../branding/branding.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { UsersModule } from "../identity/users/users.module";
import { PassportsModule } from "../passports/passports.module";
import { TraceabilityEventsModule } from "../traceability-events/traceability-events.module";
import { UniqueProductIdentifierRepository } from "./infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "./infrastructure/unique-product-identifier.schema";
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
  ],
  controllers: [UniqueProductIdentifierController],
  providers: [
    UniqueProductIdentifierApplicationService,
    UniqueProductIdentifierRepository,
  ],
  exports: [
    UniqueProductIdentifierRepository,
    UniqueProductIdentifierApplicationService,
  ],
})
export class UniqueProductIdentifierModule {}
