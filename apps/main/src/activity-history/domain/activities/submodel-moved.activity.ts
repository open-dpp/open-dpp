import { ActivityHeader } from "./activity-header";
import {
  SharedActivityCreateProps,
  createActivityHeader,
  IActivity,
  activityToDatabase,
  ActivitySchema,
} from "./shared.activity";
import { Environment } from "../../../aas/domain/environment";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { SubmodelActivityPayload } from "./submodel-activities.shared";

const SubmodelMovedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelMovedActivity implements IActivity {
  public static readonly type = ActivityTypes.SubmodelMoved;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: SubmodelActivityPayload,
  ) {}
  static create(
    data: SharedActivityCreateProps & {
      submodelId: string;
      environment: Environment;
    },
  ) {
    return new SubmodelMovedActivity(
      createActivityHeader(SubmodelMovedActivity.type, data, SubmodelMovedActivityVersion.v1_0_0),
      SubmodelActivityPayload.create({
        submodelId: data.submodelId,
        changes: data.environment.tracker.stop(),
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelMovedActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelActivityPayload.fromPlain(parsed.payload),
    );
  }

  isNoop(): boolean {
    return this.payload.isNoop();
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain(options?: ConvertToPlainOptions) {
    return {
      header: this.header.toPlain(),
      payload: this.payload.toPlain(options),
    };
  }
}
