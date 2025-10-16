import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { KeycloakResourcesModule } from "../keycloak-resources/keycloak-resources.module";
import { OrganizationsModule } from "../organizations/organizations.module";
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
    OrganizationsModule,
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
