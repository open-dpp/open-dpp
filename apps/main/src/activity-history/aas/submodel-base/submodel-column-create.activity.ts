import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
} from "../../activity";
import { ActivityTypes } from "../../activity-types";
import { createActivityHeaderOld } from "../shared.activity";
import { SubmodelCreateActivityCreateProps } from "./submodel-base.activity";
import { SubmodelBaseCreateActivityPayload } from "./submodel-base-create.payload";

export class SubmodelColumnCreateActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelBaseCreateActivityPayload,
  ) {}
  static create(data: SubmodelCreateActivityCreateProps): SubmodelColumnCreateActivity {
    return new SubmodelColumnCreateActivity(
      createActivityHeaderOld(ActivityTypes.SubmodelColumnCreate, data),
      data.payload,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelColumnCreateActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelBaseCreateActivityPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain() {
    return activityToPlain(this);
  }
}
