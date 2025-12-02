import { Injectable, OnModuleInit } from "@nestjs/common";

import { registerSubmodelClasses } from "../domain/submodel-base/register-submodel-classes";

@Injectable()
export class SubmodelRegistryInitializer implements OnModuleInit {
  onModuleInit() {
    registerSubmodelClasses();
  }
}
