import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { UsersModule } from "../identity/users/users.module";
import { ModelDoc, ModelSchema } from "../models/infrastructure/model.schema";
import { ModelsModule } from "../models/models.module";
import { TemplateModule } from "../old-templates/template.module";
import { TraceabilityEventsModule } from "../traceability-events/traceability-events.module";
import { UniqueProductIdentifierModule } from "../unique-product-identifier/unique.product.identifier.module";
import { ItemDoc, ItemSchema } from "./infrastructure/item.schema";
import { ItemsService } from "./infrastructure/items.service";
import { ItemsApplicationService } from "./presentation/items-application.service";
import { ItemsController } from "./presentation/items.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ItemDoc.name,
        schema: ItemSchema,
      },
      {
        name: ModelDoc.name,
        schema: ModelSchema,
      },
    ]),
    TemplateModule,
    ModelsModule,
    UniqueProductIdentifierModule,
    UsersModule,
    TraceabilityEventsModule,
    OrganizationsModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsApplicationService],
  exports: [ItemsService],
})
export class ItemsModule {}
