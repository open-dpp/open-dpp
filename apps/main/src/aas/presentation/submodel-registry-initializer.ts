import { Injectable, OnModuleInit } from "@nestjs/common";

import { registerSubmodelElementClasses } from "../domain/submodel-base/register-submodel-element-classes";

@Injectable()
export class SubmodelRegistryInitializer implements OnModuleInit {
  onModuleInit() {
    registerSubmodelElementClasses();
  }
}
