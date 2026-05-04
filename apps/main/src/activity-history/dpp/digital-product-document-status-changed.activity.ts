import { DigitalProductDocumentStatusChange } from "../../digital-product-document/domain/digital-product-document-status";
import {
  IActivity,
  ActivityHeader,
  activityToDatabase,
  ActivitySchema,
  activityToPlain,
} from "../activity-event";

export const DigitalProductDocumentStatusChangedEventVersion = {
  v1_0_0: "1.0.0",
} as const;

export class DigitalProductDocumentStatusChangedActivity implements IActivity {
  public static readonly Type = "DigitalProductDocumentStatusChanged";

  private constructor(
    public readonly header: ActivityHeader,
    public readonly payload: DigitalProductDocumentStatusChange,
  ) {}

  static create(data: {
    id: string;
    payload: DigitalProductDocumentStatusChange;
  }): DigitalProductDocumentStatusChangedActivity {
    const header = ActivityHeader.create({
      type: DigitalProductDocumentStatusChangedActivity.Type,
      version: DigitalProductDocumentStatusChangedEventVersion.v1_0_0,
      aggregateId: data.id,
    });
    return new DigitalProductDocumentStatusChangedActivity(header, data.payload);
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);
    return new DigitalProductDocumentStatusChangedActivity(
      ActivityHeader.fromPlain(parsed.header),
      DigitalProductDocumentStatusChange.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain() {
    return activityToPlain(this);
  }
}
