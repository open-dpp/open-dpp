import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
  IActivityPayload,
} from "../activity-event";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { z } from "zod";
import { ActivityTypes } from "../activity-types";

export const SubmodelElementModificationActivityVersion = {
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
      type: ActivityTypes.SubmodelElementModification,
      version: SubmodelElementModificationActivityVersion.v1_0_0,
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
    return activityToPlain(this);
  }
}

const SubmodelElementModificationActivityPayloadSchema = z.object({
  submodelId: z.string(),
  fullIdShortPath: z.string(),
  data: z.unknown(),
});

export class SubmodelElementModificationActivityPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly fullIdShortPath: IdShortPath,
    public readonly data: unknown,
  ) {}
  static create(data: { submodelId: string; fullIdShortPath: IdShortPath; data: unknown }) {
    return new SubmodelElementModificationActivityPayload(
      data.submodelId,
      data.fullIdShortPath,
      data.data,
    );
  }
  static fromPlain(data: unknown) {
    const parsed = SubmodelElementModificationActivityPayloadSchema.parse(data);
    return new SubmodelElementModificationActivityPayload(
      parsed.submodelId,
      IdShortPath.create({ path: parsed.fullIdShortPath }),
      parsed.data,
    );
  }
  toPlain() {
    return {
      submodelId: this.submodelId,
      fullIdShortPath: this.fullIdShortPath.toString(),
      data: this.data,
    };
  }
}
