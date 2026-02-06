import { Module } from "@nestjs/common";
import { AasModule } from "../aas/aas.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { BrandingRepository } from "./infrastructure/branding.repository";
import { BrandingController } from "./presentation/branding.controller";

@Module({
  imports: [
    AasModule,
    OrganizationsModule,
  ],
  controllers: [BrandingController],
  providers: [BrandingRepository],
})
export class BrandingModule { }
