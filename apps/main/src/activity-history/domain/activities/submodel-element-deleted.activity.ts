import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  IActivity,
  IActivityPayload,
} from "./activity";
import { ActivityHeaderCreateProps, createActivityHeader } from "./shared.activity";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";
import { ChangeEventSchema, IChangeEvent, parseChangeEvent } from "../change-events/change-event";
import { z } from "zod";

const SubmodelElementDeletedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelElementDeletedActivity implements IActivity {
  public static readonly type = ActivityTypes.SubmodelElementDeleted;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: SubmodelElementDeletedPayload,
  ) {}
  static create(
    data: ActivityHeaderCreateProps & {
      submodel: Submodel;
      aas: AssetAdministrationShell;
    },
  ) {
    return new SubmodelElementDeletedActivity(
      createActivityHeader(
        SubmodelElementDeletedActivity.type,
        data,
        SubmodelElementDeletedActivityVersion.v1_0_0,
      ),
      SubmodelElementDeletedPayload.create({
        aasId: data.aas.id,
        submodelId: data.submodel.id,
        changes: [...data.submodel.eventQueue.pullChanges(), ...data.aas.eventQueue.pullChanges()],
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelElementDeletedActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelElementDeletedPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain(_options?: ConvertToPlainOptions) {
    return {
      header: this.header.toPlain(),
      payload: this.payload.toPlain(),
    };
  }
}

const PayloadSchema = z.object({
  submodelId: z.string(),
  aasId: z.string(),
  changes: ChangeEventSchema.array(),
});

export class SubmodelElementDeletedPayload implements IActivityPayload {
  private constructor(
    public readonly aasId: string,
    public readonly submodelId: string,
    public readonly changes: IChangeEvent[],
  ) {}
  static create(data: { aasId: string; submodelId: string; changes: IChangeEvent[] }) {
    return new SubmodelElementDeletedPayload(data.aasId, data.submodelId, data.changes);
  }
  static fromPlain(data: unknown) {
    const parsed = PayloadSchema.parse(data);
    return new SubmodelElementDeletedPayload(
      parsed.aasId,
      parsed.submodelId,
      parsed.changes.map(parseChangeEvent),
    );
  }
  toPlain() {
    return {
      submodelId: this.submodelId,
      aasId: this.aasId,
      changes: this.changes.map((change) => change.toPlain()),
    };
  }
}
