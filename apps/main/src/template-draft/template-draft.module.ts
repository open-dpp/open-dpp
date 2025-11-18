import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import {
  TemplateDoc,
  TemplateSchema,
} from "../templates/infrastructure/template.schema";
import { TemplateService } from "../templates/infrastructure/template.service";
import {
  TemplateDraftDoc,
  TemplateDraftSchema,
} from "./infrastructure/template-draft.schema";
import { TemplateDraftService } from "./infrastructure/template-draft.service";
import { TemplateDraftController } from "./presentation/template-draft.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TemplateDraftDoc.name,
        schema: TemplateDraftSchema,
      },
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    AuthModule,
    MarketplaceModule,
    OrganizationsModule,
  ],
  controllers: [TemplateDraftController],
  providers: [TemplateService, TemplateDraftService],
  exports: [TemplateDraftService],
})
export class TemplateDraftModule {}
