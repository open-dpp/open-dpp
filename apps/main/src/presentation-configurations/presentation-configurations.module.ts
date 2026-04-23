import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportRepository } from "../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../passports/infrastructure/passport.schema";
import { TemplateRepository } from "../templates/infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../templates/infrastructure/template.schema";
import { PresentationConfigurationService } from "./application/services/presentation-configuration.service";
import { PresentationConfigurationRepository } from "./infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "./infrastructure/presentation-configuration.schema";
import { PresentationConfigurationController } from "./presentation/presentation-configuration.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PresentationConfigurationDoc.name,
        schema: PresentationConfigurationSchema,
      },
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
      {
        name: PassportDoc.name,
        schema: PassportSchema,
      },
    ]),
  ],
  controllers: [PresentationConfigurationController],
  providers: [
    PresentationConfigurationRepository,
    PresentationConfigurationService,
    TemplateRepository,
    PassportRepository,
  ],
  exports: [PresentationConfigurationRepository, PresentationConfigurationService],
})
export class PresentationConfigurationsModule {}
