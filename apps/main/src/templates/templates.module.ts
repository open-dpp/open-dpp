import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasModule } from "../aas/aas.module";

import { SubmodelRegistryInitializer } from "../aas/presentation/submodel-registry-initializer";
import { AuthModule } from "../identity/auth/auth.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { TemplateService } from "./application/template.service";
import { TemplateRepository } from "./infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "./infrastructure/template.schema";
import { TemplateController } from "./presentation/template.controller";
import { ActivityHistoryModule } from "../activity-history/activity-history.module";
import { CorrelationIdService } from "../common/middleware/correlation-id.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    ActivityHistoryModule,
    AasModule,
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [TemplateController],
  providers: [
    SubmodelRegistryInitializer,
    TemplateRepository,
    TemplateService,
    CorrelationIdService,
  ],
  exports: [TemplateRepository, TemplateService],
})
export class TemplatesModule {}
