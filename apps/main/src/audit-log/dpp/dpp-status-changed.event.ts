import { DppStatusChange } from "../../dpp/domain/dpp-status";
import { AuditEvent, AuditEventHeader } from "../audit-event";

export const DppStatusChangedEventVersion = {
  v1_0_0: "1.0.0",
} as const;

export class DppStatusChangedEvent implements AuditEvent<DppStatusChange> {
  public static readonly Type = "DppStatusChanged";

  private constructor(
    public readonly header: AuditEventHeader,
    public readonly payload: DppStatusChange,
  ) {}

  static create(data: { id: string; payload: DppStatusChange }): DppStatusChangedEvent {
    const header = AuditEventHeader.create({
      type: DppStatusChangedEvent.Type,
      version: DppStatusChangedEventVersion.v1_0_0,
      aggregateId: data.id,
    });
    return new DppStatusChangedEvent(header, data.payload);
  }

  static fromPlain(data: unknown) {
    return new DppStatusChangedEvent(
      AuditEventHeader.fromPlain(data),
      DppStatusChange.fromPlain(data),
    );
  }

  toPlain(): Record<string, unknown> {
    return {
      header: this.header.toPlain(),
      payload: this.payload.toPlain(),
    };
  }
}
