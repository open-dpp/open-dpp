import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { InstanceSettingsService } from "./application/services/instance-settings.service";
import { InstanceSettingsRepository } from "./infrastructure/adapters/instance-settings.repository";
import {
  InstanceSettingsMongooseSchema,
  InstanceSettingsSchema,
} from "./infrastructure/schemas/instance-settings.schema";
import { InstanceSettingsController } from "./presentation/instance-settings.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InstanceSettingsSchema.name, schema: InstanceSettingsMongooseSchema },
    ]),
  ],
  controllers: [InstanceSettingsController],
  providers: [InstanceSettingsService, InstanceSettingsRepository],
  exports: [InstanceSettingsService],
})
export class InstanceSettingsModule {}
