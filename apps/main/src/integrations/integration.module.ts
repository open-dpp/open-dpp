import { Module } from '@nestjs/common';
import { AasConnectionController } from './presentation/aas-connection.controller';
import { ModelsService } from '../models/infrastructure/models.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UniqueProductIdentifierModule } from '../unique-product-identifier/unique.product.identifier.module';
import { ItemDoc, ItemSchema } from '../items/infrastructure/item.schema';
import { ModelDoc, ModelSchema } from '../models/infrastructure/model.schema';
import { TemplateModule } from '../templates/template.module';
import {
  AasConnectionDoc,
  AasConnectionSchema,
} from './infrastructure/aas-connection.schema';
import { AasConnectionService } from './infrastructure/aas-connection.service';
import { ItemsService } from '../items/infrastructure/items.service';
import { TraceabilityEventsModule } from '../traceability-events/traceability-events.module';
import { ItemsApplicationService } from '../items/presentation/items-application.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PermissionModule } from '@app/permission';

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
        name: AasConnectionDoc.name,
        schema: AasConnectionSchema,
      },
    ]),
    OrganizationsModule,
    TemplateModule,
    UniqueProductIdentifierModule,
    PermissionModule,
    TraceabilityEventsModule,
  ],
  controllers: [AasConnectionController],
  providers: [
    ModelsService,
    ItemsService,
    ItemsApplicationService,
    AasConnectionService,
  ],
  exports: [],
})
export class IntegrationModule {}
