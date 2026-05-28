import { ActivityHeader, ActivitySchema, activityToDatabase, IActivity } from "./activity";
import { ActivityHeaderCreateProps, createActivityHeader } from "./shared.activity";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { SubmodelActivityPayload } from "./submodel-activities.shared";

const SubmodelElementModifiedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelElementModifiedActivity implements IActivity {
  public static readonly type = ActivityTypes.SubmodelElementModified;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: SubmodelActivityPayload,
  ) {}
  static create(
    data: ActivityHeaderCreateProps & {
      submodel: Submodel;
    },
  ) {
    return new SubmodelElementModifiedActivity(
      createActivityHeader(
        SubmodelElementModifiedActivity.type,
        data,
        SubmodelElementModifiedActivityVersion.v1_0_0,
      ),
      SubmodelActivityPayload.create({
        submodelId: data.submodel.id,
        changes: data.submodel.eventQueue.pullChanges(),
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelElementModifiedActivity(
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
