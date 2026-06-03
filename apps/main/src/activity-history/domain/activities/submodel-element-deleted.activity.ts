import { ActivityHeader } from "./activity-header";
import {
  ActivitySchema,
  activityToDatabase,
  createActivityHeader,
  IActivity,
  SharedActivityCreateProps,
} from "./shared.activity";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";
import { SubmodelWithAasActivityPayload } from "./submodel-activities.shared";

const SubmodelElementDeletedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelElementDeletedActivity implements IActivity {
  public static readonly type = ActivityTypes.SubmodelElementDeleted;
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
    return new SubmodelElementDeletedActivity(
      createActivityHeader(
        SubmodelElementDeletedActivity.type,
        data,
        SubmodelElementDeletedActivityVersion.v1_0_0,
      ),
      SubmodelWithAasActivityPayload.create({
        aasId: data.aas.id,
        submodelId: data.submodel.id,
        changes: [...data.submodel.tracker.stop(), ...data.aas.tracker.stop()],
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelElementDeletedActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelWithAasActivityPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  isNoop(): boolean {
    return this.payload.isNoop();
  }

  toPlain(options?: ConvertToPlainOptions) {
    return {
      header: this.header.toPlain(),
      payload: this.payload.toPlain(options),
    };
  }
}
