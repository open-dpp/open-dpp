import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
} from "../../activity";
import { ActivityTypes } from "../../activity-types";
import { createActivityHeader, SharedActivityCreateProps } from "../shared.activity";
import { SubmodelBaseCreateActivityPayload } from "./submodel-base-create.payload";
import { SubmodelRowCreateActivityPayload } from "./submodel-row-create.payload";

interface SubmodelRowCreateActivityCreateProps extends SharedActivityCreateProps {
  payload: SubmodelRowCreateActivityPayload;
}

export class SubmodelRowCreateActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelRowCreateActivityPayload,
  ) {}
  static create(data: SubmodelRowCreateActivityCreateProps): SubmodelRowCreateActivity {
    return new SubmodelRowCreateActivity(
      createActivityHeader(ActivityTypes.SubmodelRowCreate, data),
      data.payload,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelRowCreateActivity(
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
