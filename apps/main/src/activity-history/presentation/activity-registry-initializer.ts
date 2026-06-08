import { Injectable, OnModuleInit } from "@nestjs/common";
import { registerChangeEventClasses } from "../domain/change-events/register-change-event-classes";
import { registerActivityClasses } from "../domain/activities/register-activity-classes";

@Injectable()
export class ActivityRegistriesInitializer implements OnModuleInit {
  onModuleInit() {
    registerActivityClasses();
    registerChangeEventClasses();
  }
}
