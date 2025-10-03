import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PermissionModule } from "@open-dpp/auth";
import { ItemDoc, ItemSchema } from "../items/infrastructure/item.schema";
import { ItemsService } from "../items/infrastructure/items.service";
import { ModelDoc, ModelSchema } from "../models/infrastructure/model.schema";
import { ModelsService } from "../models/infrastructure/models.service";
import { OrganizationsModule } from "../organizations/organizations.module";
import {
  TemplateDoc,
  TemplateSchema,
} from "../templates/infrastructure/template.schema";
import { TemplateService } from "../templates/infrastructure/template.service";
import { TraceabilityEventsModule } from "../traceability-events/traceability-events.module";
import { UsersModule } from "../users/users.module";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "./infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "./infrastructure/unique-product-identifier.service";
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
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    OrganizationsModule,
    PermissionModule,
    UsersModule,
    TraceabilityEventsModule,
  ],
  controllers: [UniqueProductIdentifierController],
  providers: [
    UniqueProductIdentifierService,
    ModelsService,
    TemplateService,
    ItemsService,
  ],
  exports: [UniqueProductIdentifierService],
})
export class UniqueProductIdentifierModule {}
