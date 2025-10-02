import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PermissionModule } from '@open-dpp/auth'
import { MarketplaceModule } from '../marketplace/marketplace.module'
import { OrganizationsModule } from '../organizations/organizations.module'
import {
  TemplateDoc,
  TemplateSchema,
} from '../templates/infrastructure/template.schema'
import { TemplateModule } from '../templates/template.module'
import { TraceabilityEventsModule } from '../traceability-events/traceability-events.module'
import { UniqueProductIdentifierModule } from '../unique-product-identifier/unique.product.identifier.module'
import { UsersModule } from '../users/users.module'
import { ModelDoc, ModelSchema } from './infrastructure/model.schema'
import { ModelsService } from './infrastructure/models.service'
import { ModelsController } from './presentation/models.controller'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ModelDoc.name,
        schema: ModelSchema,
      },
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    TemplateModule,
    OrganizationsModule,
    UniqueProductIdentifierModule,
    UsersModule,
    PermissionModule,
    TraceabilityEventsModule,
    MarketplaceModule,
  ],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
