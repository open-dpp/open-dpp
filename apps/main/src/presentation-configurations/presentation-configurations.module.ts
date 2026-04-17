import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PresentationConfigurationService } from "./application/services/presentation-configuration.service";
import { PresentationConfigurationRepository } from "./infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "./infrastructure/presentation-configuration.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PresentationConfigurationDoc.name,
        schema: PresentationConfigurationSchema,
      },
    ]),
  ],
  providers: [PresentationConfigurationRepository, PresentationConfigurationService],
  exports: [PresentationConfigurationRepository, PresentationConfigurationService],
})
export class PresentationConfigurationsModule {}
