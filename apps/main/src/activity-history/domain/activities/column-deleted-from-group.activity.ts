import { ActivityHeader } from "./activity-header";
import {
  SharedActivityCreateProps,
  createActivityHeader,
  IActivity,
  activityToDatabase,
  ActivitySchema,
} from "./shared.activity";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { SubmodelWithAasActivityPayload } from "./submodel-activities.shared";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";

const ColumnDeletedFromGroupActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class ColumnDeletedFromGroupActivity implements IActivity {
  public static readonly type = ActivityTypes.ColumnDeletedFromGroup;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: SubmodelWithAasActivityPayload,
  ) {}
  static create(
    data: SharedActivityCreateProps & {
      submodel: Submodel;
      aas: AssetAdministrationShell;
    },
  ) {
    return new ColumnDeletedFromGroupActivity(
      createActivityHeader(
        ColumnDeletedFromGroupActivity.type,
        data,
        ColumnDeletedFromGroupActivityVersion.v1_0_0,
      ),
      SubmodelWithAasActivityPayload.create({
        submodelId: data.submodel.id,
        aasId: data.aas.id,
        changes: [...data.submodel.tracker.stop(), ...data.aas.tracker.stop()],
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new ColumnDeletedFromGroupActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelWithAasActivityPayload.fromPlain(parsed.payload),
    );
  }

  isNoop(): boolean {
    return this.payload.isNoop();
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain(options?: ConvertToPlainOptions) {
    return {
      header: this.header.toPlain(),
      payload: this.payload.toPlain(options),
    };
  }
}
