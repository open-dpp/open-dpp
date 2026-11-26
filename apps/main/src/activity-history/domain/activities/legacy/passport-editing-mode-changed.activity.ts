import { ActivityHeader } from "../activity-header";
import { ActivitySchema, activityToDatabase, IActivity } from "../shared.activity";
import { ConvertToPlainOptions } from "../../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "../activity-types";
import { DigitalProductDocumentActivityPayload } from "../digital-product-document-status-changed.activity";

/**
 * Legacy: nothing creates this activity any more (see `PassportEditingModeChanged`), but it stays
 * registered so stored activity history still deserializes.
 */
export class PassportEditingModeChangedActivity implements IActivity {
  public static readonly type = ActivityTypes.PassportEditingModeChanged;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: DigitalProductDocumentActivityPayload,
  ) {}
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
