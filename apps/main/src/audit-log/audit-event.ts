import { z } from "zod";
import { IPersistable } from "../aas/domain/persistable";
import { ConvertToPlainOptions, IConvertableToPlain } from "../aas/domain/convertable-to-plain";
import { AuditEventTypesEnum } from "./audit-event-types";
import { getAuditEventClass } from "./audit-event-registry";

export const AuditEventSchema = z.object({
  id: z.string(),
  aggregateId: z.string(),
  correlationId: z.string(),
  timestamp: z.date(),
  type: z.string(),
  userId: z.string().nullable(),
  version: z.string(),
  payload: z.any(),
});

export interface IEventPayload extends IConvertableToPlain {}

export function auditEventToPlain(event: IAuditEvent, options?: ConvertToPlainOptions) {
  return {
    aggregateId: event.aggregateId,
    correlationId: event.correlationId,
    timestamp: event.timestamp,
    type: event.type,
    userId: event.userId,
    version: event.version,
    payload: event.payload.toPlain(options),
  };
}

export interface IAuditEvent extends IPersistable {
  aggregateId: string;
  correlationId: string;
  timestamp: Date;
  type: string;
  userId: string | null;
  payload: IEventPayload;
  version: string;
}

export function parseAuditEvent(auditEvent: any): IAuditEvent {
  const schema = z.object({ type: AuditEventTypesEnum });
  const AuditEventClass = getAuditEventClass(schema.parse(auditEvent).type);
  return AuditEventClass.fromPlain(auditEvent);
}
