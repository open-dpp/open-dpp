import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { AasModule } from "../aas/aas.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { BrandingRepository } from "./infrastructure/branding.repository";
import { BrandingDoc, BrandingSchema } from "./infrastructure/branding.schema";
import { BrandingController } from "./presentation/branding.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BrandingDoc.name,
        schema: BrandingSchema,
      },
    ]),
    AasModule,
    OrganizationsModule,
    EnvModule,
  ],
  controllers: [BrandingController],
  providers: [BrandingRepository],
  exports: [BrandingRepository],
})
export class BrandingModule { }
