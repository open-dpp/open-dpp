import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ActivityDbSchema, ActivityDoc } from "./infrastructure/activity.schema";
import { ActivityRegistriesInitializer } from "./presentation/activity-registry-initializer";
import { ActivityRepository } from "./infrastructure/activity.repository";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ActivityDoc.name,
        schema: ActivityDbSchema,
      },
    ]),
  ],
  providers: [ActivityRegistriesInitializer, ActivityRepository],
  exports: [ActivityRepository],
})
export class ActivityHistoryModule {}
