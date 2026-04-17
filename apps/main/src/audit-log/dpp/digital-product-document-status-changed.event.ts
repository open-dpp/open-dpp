import { DigitalProductDocumentStatusChange } from "../../digital-product-document/domain/digital-product-document-status";
import { AuditEvent, AuditEventHeader } from "../audit-event";

export const DigitalProductDocumentStatusChangedEventVersion = {
  v1_0_0: "1.0.0",
} as const;

export class DigitalProductDocumentStatusChangedEvent implements AuditEvent<DigitalProductDocumentStatusChange> {
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
    return new DigitalProductDocumentStatusChangedEvent(
      AuditEventHeader.fromPlain(data),
      DigitalProductDocumentStatusChange.fromPlain(data),
    );
  }

  toPlain(): Record<string, unknown> {
    return {
      header: this.header.toPlain(),
      payload: this.payload.toPlain(),
    };
  }
}
