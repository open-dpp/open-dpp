import { z } from "zod";

export const AuditEventTypes = {
  SubmodelElementModificationEvent: "SubmodelElementModificationEvent",
} as const;
export const AuditEventTypesEnum = z.enum(AuditEventTypes);
export type AuditEventTypesType = z.infer<typeof AuditEventTypesEnum>;
