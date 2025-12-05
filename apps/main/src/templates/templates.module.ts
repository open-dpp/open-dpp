import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasModule } from "../aas/aas.module";

import { SubmodelRegistryInitializer } from "../aas/presentation/submodel-registry-initializer";
import { AuthModule } from "../auth/auth.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { TemplateRepository } from "./infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "./infrastructure/template.schema";
import { TemplateController } from "./presentation/template.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    AasModule,
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [TemplateController],
  providers: [SubmodelRegistryInitializer, TemplateRepository],
  exports: [TemplateRepository],
})
export class TemplatesModule {}
