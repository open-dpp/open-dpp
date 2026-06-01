import { ActivityHeader, ActivitySchema, activityToDatabase, IActivity } from "./activity";
import { createActivityHeader, SharedActivityCreateProps } from "./shared.activity";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { SubmodelWithAasActivityPayload } from "./submodel-activities.shared";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";
import { Environment } from "../../../aas/domain/environment";
import { SubmodelDeleted } from "../change-events/submodel-deleted";

const SubmodelDeletedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelDeletedActivity implements IActivity {
  public static readonly type = ActivityTypes.SubmodelDeleted;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: SubmodelWithAasActivityPayload,
  ) {}
  static create(
    data: SharedActivityCreateProps & {
      submodel: Submodel;
      aas: AssetAdministrationShell;
      environment: Environment;
    },
  ) {
    return new SubmodelDeletedActivity(
      createActivityHeader(
        SubmodelDeletedActivity.type,
        data,
        SubmodelDeletedActivityVersion.v1_0_0,
      ),
      SubmodelWithAasActivityPayload.create({
        submodelId: data.submodel.id,
        aasId: data.aas.id,
        changes: [
          ...data.submodel.tracker.pull(),
          ...data.aas.tracker.pull(),
          ...data.environment.tracker.pull(),
          SubmodelDeleted.create({ submodel: data.submodel }),
        ],
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelDeletedActivity(
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
