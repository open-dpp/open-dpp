import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasModule } from "../aas/aas.module";

import { AssetAdministrationShellDoc, AssetAdministrationShellSchema } from "../aas/infrastructure/schemas/asset-administration-shell.schema";
import { ConceptDescriptionDoc, ConceptDescriptionSchema } from "../aas/infrastructure/schemas/concept-description.schema";
import { SubmodelDoc, SubmodelSchema } from "../aas/infrastructure/schemas/submodel.schema";
import { BrandingModule } from "../branding/branding.module";
import { BrandingDoc, BrandingSchema } from "../branding/infrastructure/branding.schema";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { UsersModule } from "../identity/users/users.module";
import { PassportsModule } from "../passports/passports.module";
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
      {
        name: BrandingDoc.name,
        schema: BrandingSchema,
      },
      { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
      { name: SubmodelDoc.name, schema: SubmodelSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ]),
    AasModule,
    OrganizationsModule,
    UsersModule,
    TraceabilityEventsModule,
    PassportsModule,
    BrandingModule,
  ],
  controllers: [UniqueProductIdentifierController],
  providers: [UniqueProductIdentifierApplicationService, UniqueProductIdentifierService],
  exports: [UniqueProductIdentifierService, UniqueProductIdentifierApplicationService],
})
export class UniqueProductIdentifierModule {}
