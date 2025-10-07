import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PermissionModule } from "@open-dpp/auth";
import { KeycloakResourcesModule } from "../keycloak-resources/keycloak-resources.module";
import { ModelDoc, ModelSchema } from "../models/infrastructure/model.schema";
import { ModelsModule } from "../models/models.module";
import { OrganizationDbSchema, OrganizationDoc } from "../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../organizations/infrastructure/organizations.service";
import { TemplateModule } from "../templates/template.module";
import { TraceabilityEventsModule } from "../traceability-events/traceability-events.module";
import { UniqueProductIdentifierModule } from "../unique-product-identifier/unique.product.identifier.module";
import { UsersModule } from "../users/users.module";
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
      {
        name: OrganizationDoc.name,
        schema: OrganizationDbSchema,
      },
    ]),
    TemplateModule,
    ModelsModule,
    UniqueProductIdentifierModule,
    UsersModule,
    KeycloakResourcesModule,
    PermissionModule,
    TraceabilityEventsModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsApplicationService, OrganizationsService],
  exports: [ItemsService],
})
export class ItemsModule {}
