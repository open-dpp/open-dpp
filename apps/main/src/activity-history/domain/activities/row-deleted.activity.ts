import { ActivityHeader, ActivitySchema, activityToDatabase, IActivity } from "./activity";
import { SharedActivityCreateProps, createActivityHeader } from "./shared.activity";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import {
  SubmodelActivityPayload,
  SubmodelWithAasActivityPayload,
} from "./submodel-activities.shared";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";

const RowDeletedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class RowDeletedActivity implements IActivity {
  public static readonly type = ActivityTypes.RowDeleted;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: SubmodelActivityPayload,
  ) {}
  static create(
    data: SharedActivityCreateProps & {
      submodel: Submodel;
      aas: AssetAdministrationShell;
    },
  ) {
    return new RowDeletedActivity(
      createActivityHeader(RowDeletedActivity.type, data, RowDeletedActivityVersion.v1_0_0),
      SubmodelWithAasActivityPayload.create({
        submodelId: data.submodel.id,
        aasId: data.aas.id,
        changes: [...data.submodel.tracker.stop(), ...data.aas.tracker.stop()],
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new RowDeletedActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelWithAasActivityPayload.fromPlain(parsed.payload),
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
