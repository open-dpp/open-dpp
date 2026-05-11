import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
} from "../../activity";
import { ActivityTypes } from "../../activity-types";
import { createActivityHeader } from "../shared.activity";
import { SubmodelBaseModificationActivityPayload } from "./submodel-base-modification.payload";
import { SubmodelModificationActivityCreateProps } from "./submodel-base.activity";

export class SubmodelModificationActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelBaseModificationActivityPayload,
  ) {}
  static create(data: SubmodelModificationActivityCreateProps): SubmodelModificationActivity {
    return new SubmodelModificationActivity(
      createActivityHeader(ActivityTypes.SubmodelModification, data),
      data.payload,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelModificationActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelBaseModificationActivityPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain() {
    return activityToPlain(this);
  }
}
