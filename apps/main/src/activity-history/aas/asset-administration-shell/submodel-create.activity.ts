import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
} from "../../activity";
import { ActivityTypes } from "../../activity-types";
import { createActivityHeader, SharedActivityCreateProps } from "../shared.activity";
import { SubmodelCreateActivityPayload } from "./submodel-create.payload";

export interface SubmodelCreateActivityCreateProps extends SharedActivityCreateProps {
  payload: SubmodelCreateActivityPayload;
}

export class SubmodelCreateActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelCreateActivityPayload,
  ) {}
  static create(data: SubmodelCreateActivityCreateProps): SubmodelCreateActivity {
    return new SubmodelCreateActivity(
      createActivityHeader(ActivityTypes.SubmodelCreate, data),
      data.payload,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelCreateActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelCreateActivityPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain() {
    return activityToPlain(this);
  }
}
