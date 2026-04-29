import { AuditEventTypes } from "./audit-event-types";
import { SubmodelElementModificationEvent } from "./aas/submodel-element-modification.event";
import { registerAuditEvent } from "./audit-event-registry";

export function registerAuditEventClasses(): void {
  registerAuditEvent(
    AuditEventTypes.SubmodelElementModificationEvent,
    SubmodelElementModificationEvent,
  );
}
