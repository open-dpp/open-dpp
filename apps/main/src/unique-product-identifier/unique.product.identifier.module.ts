import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasRepository } from "../aas/infrastructure/aas.repository";
import { AssetAdministrationShellDoc, AssetAdministrationShellSchema } from "../aas/infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../aas/infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "../aas/infrastructure/submodel.repository";
import { EnvironmentService } from "../aas/presentation/environment.service";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { UsersModule } from "../identity/users/users.module";
import { ItemDoc, ItemSchema } from "../items/infrastructure/item.schema";
import { ItemsService } from "../items/infrastructure/items.service";
import { ModelDoc, ModelSchema } from "../models/infrastructure/model.schema";
import { ModelsService } from "../models/infrastructure/models.service";
import {
  OldTemplateDoc,
  TemplateSchema,
} from "../old-templates/infrastructure/template.schema";
import { TemplateService } from "../old-templates/infrastructure/template.service";
import { PassportRepository } from "../passports/infrastructure/passport.repository";
import { PassportSchema } from "../passports/infrastructure/passport.schema";
import { PassportDoc } from "../product-passport-data/infrastructure/product-passport-data.schema";
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
        name: ItemDoc.name,
        schema: ItemSchema,
      },
      {
        name: ModelDoc.name,
        schema: ModelSchema,
      },
      {
        name: OldTemplateDoc.name,
        schema: TemplateSchema,
      },
      {
        name: PassportDoc.name,
        schema: PassportSchema,
      },
      { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
      { name: SubmodelDoc.name, schema: SubmodelSchema },
    ]),
    OrganizationsModule,
    UsersModule,
    TraceabilityEventsModule,
  ],
  controllers: [UniqueProductIdentifierController],
  providers: [
    EnvironmentService,
    SubmodelRepository,
    AasRepository,
    UniqueProductIdentifierApplicationService,
    UniqueProductIdentifierService,
    ModelsService,
    TemplateService,
    ItemsService,
    PassportRepository,
  ],
  exports: [
    UniqueProductIdentifierService,
    UniqueProductIdentifierApplicationService,
  ],
})
export class UniqueProductIdentifierModule {}
