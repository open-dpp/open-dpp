import { ActivityHeader, ActivitySchema, activityToDatabase, IActivity } from "./activity";
import { SharedActivityCreateProps, createActivityHeader } from "./shared.activity";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { SubmodelActivityPayload } from "./submodel-activities.shared";

const SubmodelModifiedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelModifiedActivity implements IActivity {
  public static readonly type = ActivityTypes.SubmodelModified;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: SubmodelActivityPayload,
  ) {}
  static create(
    data: SharedActivityCreateProps & {
      submodel: Submodel;
    },
  ) {
    return new SubmodelModifiedActivity(
      createActivityHeader(
        SubmodelModifiedActivity.type,
        data,
        SubmodelModifiedActivityVersion.v1_0_0,
      ),
      SubmodelActivityPayload.create({
        submodelId: data.submodel.id,
        changes: data.submodel.tracker.stop(),
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelModifiedActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelActivityPayload.fromPlain(parsed.payload),
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
