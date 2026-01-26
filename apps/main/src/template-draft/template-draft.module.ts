import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../identity/auth/auth.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { UsersModule } from "../identity/users/users.module";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import {
  OldTemplateDoc,
  TemplateSchema,
} from "../old-templates/infrastructure/template.schema";
import { TemplateService } from "../old-templates/infrastructure/template.service";
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
        name: OldTemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    AuthModule,
    MarketplaceModule,
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [TemplateDraftController],
  providers: [TemplateService, TemplateDraftService],
  exports: [TemplateDraftService],
})
export class TemplateDraftModule {}
