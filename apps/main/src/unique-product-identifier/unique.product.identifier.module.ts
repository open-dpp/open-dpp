import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
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
    ]),
    OrganizationsModule,
    UsersModule,
    TraceabilityEventsModule,
  ],
  controllers: [UniqueProductIdentifierController],
  providers: [
    UniqueProductIdentifierApplicationService,
    UniqueProductIdentifierService,
    ModelsService,
    TemplateService,
    ItemsService,
  ],
  exports: [
    UniqueProductIdentifierService,
    UniqueProductIdentifierApplicationService,
  ],
})
export class UniqueProductIdentifierModule {}
