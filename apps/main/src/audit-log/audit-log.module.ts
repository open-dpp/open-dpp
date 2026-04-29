import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuditEventDbSchema, AuditEventDoc } from "./infrastructure/audit-event.schema";
import { AuditEventRegistryInitializer } from "./presentation/audit-event-registry-initializer";
import { AuditEventRepository } from "./infrastructure/audit-event.repository";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AuditEventDoc.name,
        schema: AuditEventDbSchema,
      },
    ]),
  ],
  providers: [AuditEventRegistryInitializer, AuditEventRepository],
  exports: [AuditEventRepository],
})
export class AuditLogModule {}
