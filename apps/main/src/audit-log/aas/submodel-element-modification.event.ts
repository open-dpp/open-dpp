import {
  AuditEventHeader,
  AuditEventSchema,
  auditEventToDatabase,
  IAuditEvent,
  IEventPayload,
} from "../audit-event";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { z } from "zod";
import { AuditEventTypes } from "../audit-event-types";

export const SubmodelElementModificationEventVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelElementModificationEvent implements IAuditEvent {
  private constructor(
    public header: AuditEventHeader,
    readonly payload: SubmodelElementModificationEventPayload,
  ) {}
  static create(data: {
    submodelId: string;
    payload: SubmodelElementModificationEventPayload;
    userId?: string;
  }): SubmodelElementModificationEvent {
    const header = AuditEventHeader.create({
      type: AuditEventTypes.SubmodelElementModificationEvent,
      version: SubmodelElementModificationEventVersion.v1_0_0,
      aggregateId: data.submodelId,
      userId: data.userId,
    });
    return new SubmodelElementModificationEvent(header, data.payload);
  }

  static fromPlain(data: unknown) {
    const parsed = AuditEventSchema.parse(data);

    return new SubmodelElementModificationEvent(
      AuditEventHeader.fromPlain(parsed.header),
      SubmodelElementModificationEventPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return auditEventToDatabase(this);
  }
}

const SubmodelElementModificationEventPayloadSchema = z.object({
  fullIdShortPath: z.string(),
});

export class SubmodelElementModificationEventPayload implements IEventPayload {
  private constructor(public readonly fullIdShortPath: IdShortPath) {}
  static create(data: { fullIdShortPath: IdShortPath }) {
    return new SubmodelElementModificationEventPayload(data.fullIdShortPath);
  }
  static fromPlain(data: unknown) {
    const parsed = SubmodelElementModificationEventPayloadSchema.parse(data);
    return new SubmodelElementModificationEventPayload(
      IdShortPath.create({ path: parsed.fullIdShortPath }),
    );
  }
  toPlain() {
    return {
      fullIdShortPath: this.fullIdShortPath.toString(),
    };
  }
}
