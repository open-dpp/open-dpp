import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasModule } from "../aas/aas.module";
import { BrandingModule } from "../branding/branding.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { UsersModule } from "../identity/users/users.module";
import { PassportsModule } from "../passports/passports.module";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../presentation-configurations/infrastructure/presentation-configuration.schema";
import { PresentationConfigurationsModule } from "../presentation-configurations/presentation-configurations.module";
import { PermalinkDoc, PermalinkSchema } from "./infrastructure/permalink.schema";
import { PermalinkRepository } from "./infrastructure/permalink.repository";
import { PermalinkApplicationService } from "./presentation/permalink.application.service";
import { PermalinkController } from "./presentation/permalink.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
    ]),
    AasModule,
    OrganizationsModule,
    UsersModule,
    forwardRef(() => PassportsModule),
    BrandingModule,
    PresentationConfigurationsModule,
  ],
  controllers: [PermalinkController],
  providers: [PermalinkRepository, PermalinkApplicationService],
  exports: [PermalinkRepository, PermalinkApplicationService],
})
export class PermalinkModule {}
