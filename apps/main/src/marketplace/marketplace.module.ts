import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  TemplateDoc,
  TemplateSchema,
} from "../old-templates/infrastructure/template.schema";
import { TemplateService } from "../old-templates/infrastructure/template.service";
import { OrganizationsModule } from "../organizations/organizations.module";
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
