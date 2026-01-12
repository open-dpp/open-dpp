import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import { PolicyModule } from "../policy/policy.module";
import {
  OldTemplateDoc,
  TemplateSchema,
} from "../old-templates/infrastructure/template.schema";
import { TemplateModule } from "../old-templates/template.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { TraceabilityEventsModule } from "../traceability-events/traceability-events.module";
import { UniqueProductIdentifierModule } from "../unique-product-identifier/unique.product.identifier.module";
import { UsersModule } from "../users/users.module";
import { ModelDoc, ModelSchema } from "./infrastructure/model.schema";
import { ModelsService } from "./infrastructure/models.service";
import { ModelsController } from "./presentation/models.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ModelDoc.name,
        schema: ModelSchema,
      },
      {
        name: OldTemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    TemplateModule,
    OrganizationsModule,
    EnvModule,
    forwardRef(() => PolicyModule),
    UniqueProductIdentifierModule,
    UsersModule,
    TraceabilityEventsModule,
    MarketplaceModule,
  ],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
