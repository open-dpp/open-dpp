import { IAuditEvent, AuditEventSchema, auditEventToPlain, IEventPayload } from "../audit-event";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { z } from "zod";
import { AuditEventTypes } from "../audit-event-types";
import { randomUUID } from "node:crypto";

export const SubmodelElementModificationEventVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelElementModificationEvent implements IAuditEvent {
  private constructor(
    public id: string,
    public aggregateId: string,
    public correlationId: string,
    public timestamp: Date,
    public type: string,
    public userId: string | null,
    public version: string,
    readonly payload: SubmodelElementModificationEventPayload,
  ) {}
  static create(data: {
    submodelId: string;
    payload: SubmodelElementModificationEventPayload;
    userId?: string;
  }): SubmodelElementModificationEvent {
    return new SubmodelElementModificationEvent(
      randomUUID(),
      data.submodelId,
      randomUUID(),
      new Date(),
      AuditEventTypes.SubmodelElementModificationEvent,
      data.userId ?? null,
      SubmodelElementModificationEventVersion.v1_0_0,
      data.payload,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = AuditEventSchema.parse(data);

    return new SubmodelElementModificationEvent(
      parsed.id,
      parsed.aggregateId,
      parsed.correlationId,
      parsed.timestamp,
      parsed.type,
      parsed.userId,
      parsed.version,
      SubmodelElementModificationEventPayload.fromPlain(parsed.payload),
    );
  }

  toPlain(): Record<string, unknown> {
    const plain = auditEventToPlain(this);
    return plain;
  }
}

const SubmodelElementModificationEventPayloadSchema = z.object({
  idShortPath: z.string(),
});

export class SubmodelElementModificationEventPayload implements IEventPayload {
  private constructor(public readonly idShortPath: IdShortPath) {}
  static create(data: { fullIdShortPath: IdShortPath }) {
    return new SubmodelElementModificationEventPayload(data.fullIdShortPath);
  }
  static fromPlain(data: unknown) {
    const parsed = SubmodelElementModificationEventPayloadSchema.parse(data);
    return new SubmodelElementModificationEventPayload(
      IdShortPath.create({ path: parsed.idShortPath }),
    );
  }
  toPlain() {
    return {
      idShortPath: this.idShortPath.toString(),
    };
  }
}
