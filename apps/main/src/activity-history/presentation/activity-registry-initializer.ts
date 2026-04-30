import { Injectable, OnModuleInit } from "@nestjs/common";
import { registerActivityEventClasses } from "../register-activity-event-classes";

@Injectable()
export class ActivityRegistryInitializer implements OnModuleInit {
  onModuleInit() {
    registerActivityEventClasses();
  }
}
