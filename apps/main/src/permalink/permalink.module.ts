import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { AasModule } from "../aas/aas.module";
import { BrandingModule } from "../branding/branding.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { UsersModule } from "../identity/users/users.module";
import { InstanceSettingsModule } from "../instance-settings/instance-settings.module";
import { MediaModule } from "../media/media.module";
import { PassportsModule } from "../passports/passports.module";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../presentation-configurations/infrastructure/presentation-configuration.schema";
import { PresentationConfigurationsModule } from "../presentation-configurations/presentation-configurations.module";
import { UniqueProductIdentifierModule } from "../unique-product-identifier/unique.product.identifier.module";
import { PermalinkDoc, PermalinkSchema } from "./infrastructure/permalink.schema";
import { PermalinkRepository } from "./infrastructure/permalink.repository";
import { PermalinkApplicationService } from "./application/services/permalink.application.service";
import { MediaPermalinkController } from "./presentation/media-permalink.controller";
import { PermalinkController } from "./presentation/permalink.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
    ]),
    AasModule,
    EnvModule,
    OrganizationsModule,
    UsersModule,
    InstanceSettingsModule,
    // ADR 0006: public, permalink-gated media reads (MediaModule exports MediaService).
    MediaModule,
    forwardRef(() => PassportsModule),
    forwardRef(() => UniqueProductIdentifierModule),
    BrandingModule,
    PresentationConfigurationsModule,
  ],
  controllers: [PermalinkController, MediaPermalinkController],
  providers: [PermalinkRepository, PermalinkApplicationService],
  exports: [PermalinkRepository, PermalinkApplicationService],
})
export class PermalinkModule {}
