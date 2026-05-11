import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
} from "../../activity";
import { ActivityTypes } from "../../activity-types";
import { SubmodelBaseModificationActivityPayload } from "./submodel-base-modification.payload";
import { createActivityHeader } from "../shared.activity";

export class SubmodelColumnModificationActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelBaseModificationActivityPayload,
  ) {}
  static create(data: {
    digitalProductDocumentId: string;
    payload: SubmodelBaseModificationActivityPayload;
    userId?: string;
    createdAt?: Date;
  }) {
    return new SubmodelColumnModificationActivity(
      createActivityHeader(ActivityTypes.SubmodelColumnModification, data),
      data.payload,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelColumnModificationActivity(
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
