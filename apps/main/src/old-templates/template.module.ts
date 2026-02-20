import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { OldTemplateDoc, TemplateSchema } from "./infrastructure/template.schema";
import { TemplateService } from "./infrastructure/template.service";
import { TemplateController } from "./presentation/template.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: OldTemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    OrganizationsModule,
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
