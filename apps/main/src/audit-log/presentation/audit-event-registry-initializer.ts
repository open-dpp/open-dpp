import { Injectable, OnModuleInit } from "@nestjs/common";
import { registerAuditEventClasses } from "../register-audit-event-classes";

@Injectable()
export class AuditEventRegistryInitializer implements OnModuleInit {
  onModuleInit() {
    registerAuditEventClasses();
  }
}
