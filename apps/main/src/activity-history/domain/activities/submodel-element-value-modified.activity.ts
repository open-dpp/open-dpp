import { ActivityHeader } from "./activity-header";
import {
  ActivitySchema,
  activityToDatabase,
  createActivityHeader,
  IActivity,
  SharedActivityCreateProps,
} from "./shared.activity";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { SubmodelActivityPayload } from "./submodel-activities.shared";

const SubmodelElementValueModifiedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelElementValueModifiedActivity implements IActivity {
  public static readonly type = ActivityTypes.SubmodelElementValueModified;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: SubmodelActivityPayload,
  ) {}
  static create(
    data: SharedActivityCreateProps & {
      submodel: Submodel;
    },
  ) {
    return new SubmodelElementValueModifiedActivity(
      createActivityHeader(
        SubmodelElementValueModifiedActivity.type,
        data,
        SubmodelElementValueModifiedActivityVersion.v1_0_0,
      ),
      SubmodelActivityPayload.create({
        submodelId: data.submodel.id,
        changes: data.submodel.tracker.stop(),
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelElementValueModifiedActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelActivityPayload.fromPlain(parsed.payload),
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
