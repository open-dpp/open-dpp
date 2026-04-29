import { z } from "zod";
import { IConvertableToPlain } from "../aas/domain/convertable-to-plain";
import { AuditEventTypesEnum } from "./audit-event-types";
import { getAuditEventClass } from "./audit-event-registry";
import { randomUUID } from "node:crypto";

export const AuditEventHeaderSchema = z.object({
  id: z.string(),
  aggregateId: z.string(),
  correlationId: z.string(),
  timestamp: z.date(),
  type: z.string(),
  userId: z.string().nullable(),
  version: z.string(),
});

export const AuditEventSchema = z.object({
  header: AuditEventHeaderSchema,
  payload: z.any(),
});

export class AuditEventHeader {
  private constructor(
    public readonly id: string,
    public readonly aggregateId: string,
    public readonly correlationId: string,
    public readonly timestamp: Date,
    public readonly type: string,
    public readonly userId: string | null,
    public readonly version: string,
  ) {}

  static create(data: {
    id?: string;
    aggregateId: string;
    correlationId?: string;
    timestamp?: Date;
    type: string;
    userId?: string;
    version: string;
  }) {
    return new AuditEventHeader(
      data.id ?? randomUUID(),
      data.aggregateId,
      data.correlationId ?? randomUUID(),
      data.timestamp ?? new Date(),
      data.type,
      data.userId ?? null,
      data.version,
    );
  }

  static fromPlain(data: unknown): AuditEventHeader {
    const parsed = AuditEventHeaderSchema.parse(data);
    return new AuditEventHeader(
      parsed.id,
      parsed.aggregateId,
      parsed.correlationId,
      parsed.timestamp,
      parsed.type,
      parsed.userId,
      parsed.version,
    );
  }

  toPlain(): Record<string, unknown> {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      type: this.type,
      userId: this.userId,
      version: this.version,
    };
  }
}

export interface IEventPayload extends IConvertableToPlain {}

export function auditEventToDatabase(event: IAuditEvent) {
  return {
    ...event.header.toPlain(),
    _id: event.header.id,
    payload: event.payload.toPlain(),
  };
}

export interface IAuditEvent {
  header: AuditEventHeader;
  payload: IEventPayload;
  toDatabase: () => Record<string, any>;
}

export function parseAuditEvent(auditEvent: any): IAuditEvent {
  const schema = z.object({ header: z.object({ type: AuditEventTypesEnum }) });
  const AuditEventClass = getAuditEventClass(schema.parse(auditEvent).header.type);
  return AuditEventClass.fromPlain(auditEvent);
}
