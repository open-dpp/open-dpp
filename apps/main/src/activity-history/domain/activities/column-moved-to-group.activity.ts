import { ActivityHeader } from "./activity-header";
import {
  SharedActivityCreateProps,
  createActivityHeader,
  IActivity,
  activityToDatabase,
  ActivitySchema,
} from "./shared.activity";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { SubmodelActivityPayload } from "./submodel-activities.shared";

const ColumnMovedToGroupActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class ColumnMovedToGroupActivity implements IActivity {
  public static readonly type = ActivityTypes.ColumnMovedToGroup;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: SubmodelActivityPayload,
  ) {}
  static create(
    data: SharedActivityCreateProps & {
      submodel: Submodel;
    },
  ) {
    return new ColumnMovedToGroupActivity(
      createActivityHeader(
        ColumnMovedToGroupActivity.type,
        data,
        ColumnMovedToGroupActivityVersion.v1_0_0,
      ),
      SubmodelActivityPayload.create({
        submodelId: data.submodel.id,
        changes: data.submodel.tracker.stop(),
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new ColumnMovedToGroupActivity(
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
