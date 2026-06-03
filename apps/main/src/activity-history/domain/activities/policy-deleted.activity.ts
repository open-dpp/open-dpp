import { ActivityHeader } from "./activity-header";
import {
  ActivitySchema,
  activityToDatabase,
  createActivityHeader,
  IActivity,
  SharedActivityCreateProps,
} from "./shared.activity";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ActivityTypes } from "./activity-types";
import { AssetAdministrationShellActivityPayload } from "./aas-activities.shared";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";

const PolicyDeletedActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class PolicyDeletedActivity implements IActivity {
  public static readonly type = ActivityTypes.PolicyDeleted;
  private constructor(
    public header: ActivityHeader,
    public readonly payload: AssetAdministrationShellActivityPayload,
  ) {}
  static create(
    data: SharedActivityCreateProps & {
      aas: AssetAdministrationShell;
    },
  ) {
    return new PolicyDeletedActivity(
      createActivityHeader(PolicyDeletedActivity.type, data, PolicyDeletedActivityVersion.v1_0_0),
      AssetAdministrationShellActivityPayload.create({
        aasId: data.aas.id,
        changes: data.aas.tracker.stop(),
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new PolicyDeletedActivity(
      ActivityHeader.fromPlain(parsed.header),
      AssetAdministrationShellActivityPayload.fromPlain(parsed.payload),
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
