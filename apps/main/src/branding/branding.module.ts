import { Module } from "@nestjs/common";
import { AasModule } from "../aas/aas.module";

import { AuthModule } from "../auth/auth.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { BrandingRepository } from "./infrastructure/branding.repository";
import { BrandingController } from "./presentation/branding.controller";

@Module({
  imports: [
    AasModule,
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [BrandingController],
  providers: [BrandingRepository],
})
export class BrandingModule {}
