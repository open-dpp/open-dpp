import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import {
  OldTemplateDoc,
  TemplateSchema,
} from "../old-templates/infrastructure/template.schema";
import { TemplateService } from "../old-templates/infrastructure/template.service";
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
        name: OldTemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
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
