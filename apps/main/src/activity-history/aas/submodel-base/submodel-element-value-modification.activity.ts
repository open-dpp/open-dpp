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

export const SubmodelElementValueModificationActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelElementValueModificationActivity implements IActivity {
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
    return new SubmodelElementValueModificationActivity(
      createActivityHeader(ActivityTypes.SubmodelElementValueModification, data),
      data.payload,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelElementValueModificationActivity(
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
