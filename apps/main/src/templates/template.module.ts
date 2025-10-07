import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PermissionModule } from "@open-dpp/auth";
import { KeycloakResourcesModule } from "../keycloak-resources/keycloak-resources.module";
import { TemplateDoc, TemplateSchema } from "./infrastructure/template.schema";
import { TemplateService } from "./infrastructure/template.service";
import { TemplateController } from "./presentation/template.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    KeycloakResourcesModule,
    PermissionModule,
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
