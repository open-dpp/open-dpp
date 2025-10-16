import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationsModule } from "../../organizations/organizations.module";
import {
  AiConfigurationDbSchema,
  AiConfigurationDoc,
} from "./infrastructure/ai-configuration.schema";
import { AiConfigurationService } from "./infrastructure/ai-configuration.service";
import { AiConfigurationController } from "./presentation/ai-configuration.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AiConfigurationDoc.name,
        schema: AiConfigurationDbSchema,
      },
    ]),
    OrganizationsModule,
  ],
  controllers: [AiConfigurationController],
  providers: [AiConfigurationService],
  exports: [AiConfigurationService],
})
export class AiConfigurationModule {}
