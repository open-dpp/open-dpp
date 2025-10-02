import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PermissionModule } from '@open-dpp/auth'
import { ItemDoc, ItemSchema } from '../items/infrastructure/item.schema'
import { ItemsService } from '../items/infrastructure/items.service'
import { ItemsApplicationService } from '../items/presentation/items-application.service'
import { ModelDoc, ModelSchema } from '../models/infrastructure/model.schema'
import { ModelsService } from '../models/infrastructure/models.service'
import { OrganizationsModule } from '../organizations/organizations.module'
import { TemplateModule } from '../templates/template.module'
import { TraceabilityEventsModule } from '../traceability-events/traceability-events.module'
import { UniqueProductIdentifierModule } from '../unique-product-identifier/unique.product.identifier.module'
import {
  AasConnectionDoc,
  AasConnectionSchema,
} from './infrastructure/aas-connection.schema'
import { AasConnectionService } from './infrastructure/aas-connection.service'
import { AasConnectionController } from './presentation/aas-connection.controller'

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
