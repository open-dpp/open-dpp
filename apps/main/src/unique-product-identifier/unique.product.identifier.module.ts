import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasRepository } from "../aas/infrastructure/aas.repository";
import { ConceptDescriptionRepository } from "../aas/infrastructure/concept-description.repository";
import { AssetAdministrationShellDoc, AssetAdministrationShellSchema } from "../aas/infrastructure/schemas/asset-administration-shell.schema";
import { ConceptDescriptionDoc, ConceptDescriptionSchema } from "../aas/infrastructure/schemas/concept-description.schema";
import { SubmodelDoc, SubmodelSchema } from "../aas/infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "../aas/infrastructure/submodel.repository";
import { EnvironmentService } from "../aas/presentation/environment.service";
import { BrandingRepository } from "../branding/infrastructure/branding.repository";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { UsersModule } from "../identity/users/users.module";

import { PassportRepository } from "../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../passports/infrastructure/passport.schema";
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
        name: PassportDoc.name,
        schema: PassportSchema,
      },
      {
        name: UniqueProductIdentifierDoc.name,
        schema: UniqueProductIdentifierSchema,
      },
      { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
      { name: SubmodelDoc.name, schema: SubmodelSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ]),
    OrganizationsModule,
    UsersModule,
    TraceabilityEventsModule,
    PassportsModule,
  ],
  controllers: [UniqueProductIdentifierController],
  providers: [
    EnvironmentService,
    SubmodelRepository,
    AasRepository,
    ConceptDescriptionRepository,
    UniqueProductIdentifierApplicationService,
    UniqueProductIdentifierService,
    PassportRepository,
    BrandingRepository,
  ],
  exports: [
    UniqueProductIdentifierService,
    UniqueProductIdentifierApplicationService,
  ],
})
export class UniqueProductIdentifierModule {}
