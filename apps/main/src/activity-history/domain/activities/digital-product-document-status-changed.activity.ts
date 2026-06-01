import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  IActivity,
  IActivityPayload,
} from "./activity";
import { createActivityHeader, SharedActivityCreateProps } from "./shared.activity";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { ChangeEventSchema, IChangeEvent, parseChangeEvent } from "../change-events/change-event";
import { z } from "zod/v4";
import { IDigitalProductDocument } from "../../../digital-product-document/domain/digital-product-document";
import { ITrackable } from "../change-tracker";

const DigitalProductDocumentStatusChangedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class DigitalProductDocumentStatusChangedActivity implements IActivity {
  public static readonly type = ActivityTypes.DigitalProductDocumentStatusChanged;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: DigitalProductDocumentActivityPayload,
  ) {}
  static create(
    data: SharedActivityCreateProps & {
      item: IDigitalProductDocument & ITrackable;
    },
  ) {
    return new DigitalProductDocumentStatusChangedActivity(
      createActivityHeader(
        DigitalProductDocumentStatusChangedActivity.type,
        data,
        DigitalProductDocumentStatusChangedActivityVersion.v1_0_0,
      ),
      DigitalProductDocumentActivityPayload.create({
        changes: data.item.tracker.stop(),
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new DigitalProductDocumentStatusChangedActivity(
      ActivityHeader.fromPlain(parsed.header),
      DigitalProductDocumentActivityPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain(_options?: ConvertToPlainOptions) {
    return {
      header: this.header.toPlain(),
      payload: this.payload.toPlain(),
    };
  }
}

const PayloadSchema = z.object({
  changes: ChangeEventSchema.array(),
});

export class DigitalProductDocumentActivityPayload implements IActivityPayload {
  private constructor(public readonly changes: IChangeEvent[]) {}
  static create(data: { changes: IChangeEvent[] }) {
    return new DigitalProductDocumentActivityPayload(data.changes);
  }
  static fromPlain(data: unknown) {
    const parsed = PayloadSchema.parse(data);
    return new DigitalProductDocumentActivityPayload(parsed.changes.map(parseChangeEvent));
  }
  toPlain() {
    return {
      changes: this.changes.map((change) => change.toPlain()),
    };
  }
}
