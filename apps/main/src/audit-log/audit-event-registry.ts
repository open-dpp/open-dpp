import { AuditEventTypesType } from "./audit-event-types";
import { IAuditEvent } from "./audit-event";

// Define the static side of the classes
export interface AuditEventStatic {
  fromPlain: (data: unknown) => IAuditEvent;
}

// Create the registry
export const registry = new Map<AuditEventTypesType, AuditEventStatic>();

// Type-safe registration function
export function registerAuditEvent(type: AuditEventTypesType, constructor: AuditEventStatic): void {
  registry.set(type, constructor);
}

// Type-safe getter
export function getAuditEventClass(type: AuditEventTypesType): AuditEventStatic {
  const constructor = registry.get(type);
  if (!constructor) {
    throw new Error(`No class registered for type ${type}`);
  }
  return constructor;
}
