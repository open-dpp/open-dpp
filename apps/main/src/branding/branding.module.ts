import { Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { AasModule } from "../aas/aas.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { BrandingRepository } from "./infrastructure/branding.repository";
import { BrandingController } from "./presentation/branding.controller";

@Module({
  imports: [AasModule, OrganizationsModule, EnvModule],
  controllers: [BrandingController],
  providers: [BrandingRepository],
  exports: [BrandingRepository],
})
export class BrandingModule {}
