import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { KeycloakResourcesModule } from "../keycloak-resources/keycloak-resources.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import {
  TemplateDoc,
  TemplateSchema,
} from "../templates/infrastructure/template.schema";
import { TemplateService } from "../templates/infrastructure/template.service";
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from "./infrastructure/passport-template-publication.schema";
import { PassportTemplatePublicationService } from "./infrastructure/passport-template-publication.service";
import { MarketplaceApplicationService } from "./presentation/marketplace.application.service";
import { PassportTemplatePublicationController } from "./presentation/passport-template-publication.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PassportTemplatePublicationDoc.name,
        schema: PassportTemplatePublicationDbSchema,
      },
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    KeycloakResourcesModule,
    OrganizationsModule,
  ],
  controllers: [PassportTemplatePublicationController],
  providers: [
    PassportTemplatePublicationService,
    MarketplaceApplicationService,
    TemplateService,
  ],
  exports: [MarketplaceApplicationService],
})
export class MarketplaceModule {}
