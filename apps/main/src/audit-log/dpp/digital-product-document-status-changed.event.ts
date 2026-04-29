import { DigitalProductDocumentStatusChange } from "../../digital-product-document/domain/digital-product-document-status";
import {
  IAuditEvent,
  AuditEventHeader,
  auditEventToDatabase,
  AuditEventSchema,
} from "../audit-event";

export const DigitalProductDocumentStatusChangedEventVersion = {
  v1_0_0: "1.0.0",
} as const;

export class DigitalProductDocumentStatusChangedEvent implements IAuditEvent {
  public static readonly Type = "DigitalProductDocumentStatusChanged";

  private constructor(
    public readonly header: AuditEventHeader,
    public readonly payload: DigitalProductDocumentStatusChange,
  ) {}

  static create(data: {
    id: string;
    payload: DigitalProductDocumentStatusChange;
  }): DigitalProductDocumentStatusChangedEvent {
    const header = AuditEventHeader.create({
      type: DigitalProductDocumentStatusChangedEvent.Type,
      version: DigitalProductDocumentStatusChangedEventVersion.v1_0_0,
      aggregateId: data.id,
    });
    return new DigitalProductDocumentStatusChangedEvent(header, data.payload);
  }

  static fromPlain(data: unknown) {
    const parsed = AuditEventSchema.parse(data);
    return new DigitalProductDocumentStatusChangedEvent(
      AuditEventHeader.fromPlain(parsed.header),
      DigitalProductDocumentStatusChange.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return auditEventToDatabase(this);
  }
}
