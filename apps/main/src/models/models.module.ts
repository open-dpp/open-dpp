import { Module } from '@nestjs/common';
import { ModelsService } from './infrastructure/models.service';
import { ModelsController } from './presentation/models.controller';
import { UniqueProductIdentifierModule } from '../unique-product-identifier/unique.product.identifier.module';
import { TemplateModule } from '../templates/template.module';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TemplateDoc,
  TemplateSchema,
} from '../templates/infrastructure/template.schema';
import { TraceabilityEventsModule } from '../traceability-events/traceability-events.module';
import { ModelDoc, ModelSchema } from './infrastructure/model.schema';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import {PermissionModule} from "@app/permission";

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
