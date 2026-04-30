import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityEventToPlain,
  IActivity,
  IActivityPayload,
} from "../activity-event";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { z } from "zod";
import { ActivityTypes } from "../activity-types";

export const SubmodelElementModificationEventVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelElementModificationActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelElementModificationActivityPayload,
  ) {}
  static create(data: {
    digitalProductDocumentId: string;
    payload: SubmodelElementModificationActivityPayload;
    userId?: string;
    createdAt?: Date;
  }): SubmodelElementModificationActivity {
    const header = ActivityHeader.create({
      type: ActivityTypes.SubmodelElementModificationEvent,
      version: SubmodelElementModificationEventVersion.v1_0_0,
      aggregateId: data.digitalProductDocumentId,
      userId: data.userId,
      createdAt: data.createdAt,
    });
    return new SubmodelElementModificationActivity(header, data.payload);
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelElementModificationActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelElementModificationActivityPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain() {
    return activityEventToPlain(this);
  }
}

const SubmodelElementModificationActivityPayloadSchema = z.object({
  fullIdShortPath: z.string(),
});

export class SubmodelElementModificationActivityPayload implements IActivityPayload {
  private constructor(public readonly fullIdShortPath: IdShortPath) {}
  static create(data: { fullIdShortPath: IdShortPath }) {
    return new SubmodelElementModificationActivityPayload(data.fullIdShortPath);
  }
  static fromPlain(data: unknown) {
    const parsed = SubmodelElementModificationActivityPayloadSchema.parse(data);
    return new SubmodelElementModificationActivityPayload(
      IdShortPath.create({ path: parsed.fullIdShortPath }),
    );
  }
  toPlain() {
    return {
      fullIdShortPath: this.fullIdShortPath.toString(),
    };
  }
}
