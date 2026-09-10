import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { AasModule } from "../aas/aas.module";
import { BrandingModule } from "../branding/branding.module";
import { DatabaseModule } from "../database/database.module";
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
import { BaseUrlResolver } from "./application/services/base-url-resolver.service";
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
    DatabaseModule,
    EnvModule,
    OrganizationsModule,
    UsersModule,
    InstanceSettingsModule,
    // Permalink-gated media reads need MediaService (exported by MediaModule).
    MediaModule,
    forwardRef(() => PassportsModule),
    forwardRef(() => UniqueProductIdentifierModule),
    BrandingModule,
    PresentationConfigurationsModule,
  ],
  controllers: [PermalinkController, MediaPermalinkController],
  providers: [PermalinkRepository, PermalinkApplicationService, BaseUrlResolver],
  exports: [PermalinkRepository, PermalinkApplicationService, BaseUrlResolver],
})
export class PermalinkModule {}
