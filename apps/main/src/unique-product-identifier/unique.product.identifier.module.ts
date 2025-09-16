import { Module } from '@nestjs/common';
import { UniqueProductIdentifierController } from './presentation/unique.product.identifier.controller';
import { ModelsService } from '../models/infrastructure/models.service';
import { TemplateService } from '../templates/infrastructure/template.service';
import { UsersModule } from '../users/users.module';
import { ItemsService } from '../items/infrastructure/items.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TemplateDoc,
  TemplateSchema,
} from '../templates/infrastructure/template.schema';
import { TraceabilityEventsModule } from '../traceability-events/traceability-events.module';
import { ModelDoc, ModelSchema } from '../models/infrastructure/model.schema';
import { ItemDoc, ItemSchema } from '../items/infrastructure/item.schema';
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from './infrastructure/unique-product-identifier.schema';
import { UniqueProductIdentifierService } from './infrastructure/unique-product-identifier.service';
import {PermissionModule} from "@app/permission";

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
