import { ActivityHeader } from "./activity-header";
import {
  ActivitySchema,
  activityToDatabase,
  createActivityHeader,
  IActivity,
  SharedActivityCreateProps,
} from "./shared.activity";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { DigitalProductDocumentActivityPayload } from "./digital-product-document-status-changed.activity";
import { IDigitalProductDocument } from "../../../digital-product-document/domain/digital-product-document";
import { ITrackable } from "../change-tracker";

const PassportEditingModeChangedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class PassportEditingModeChangedActivity implements IActivity {
  public static readonly type = ActivityTypes.PassportEditingModeChanged;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: DigitalProductDocumentActivityPayload,
  ) {}
  static create(
    data: SharedActivityCreateProps & {
      item: IDigitalProductDocument & ITrackable;
    },
  ) {
    return new PassportEditingModeChangedActivity(
      createActivityHeader(
        PassportEditingModeChangedActivity.type,
        data,
        PassportEditingModeChangedActivityVersion.v1_0_0,
      ),
      DigitalProductDocumentActivityPayload.create({
        changes: data.item.tracker.stop(),
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new PassportEditingModeChangedActivity(
      ActivityHeader.fromPlain(parsed.header),
      DigitalProductDocumentActivityPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  isNoop(): boolean {
    return this.payload.isNoop();
  }

  toPlain(options?: ConvertToPlainOptions) {
    return {
      header: this.header.toPlain(),
      payload: this.payload.toPlain(options),
    };
  }
}
