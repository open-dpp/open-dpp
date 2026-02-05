import { Module } from "@nestjs/common";
import { AasModule } from "../aas/aas.module";

import { AuthModule } from "../auth/auth.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { BrandingController } from "./presentation/branding.controller";

@Module({
  imports: [
    AasModule,
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [BrandingController],
  providers: [],
})
export class BrandingModule {}
