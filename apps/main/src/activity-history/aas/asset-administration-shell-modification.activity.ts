import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
} from "../activity";
import { ActivityTypes } from "../activity-types";
import { createActivityHeader } from "./shared.activity";
import { AssetAdministrationShellModificationActivityPayload } from "./submodel-base/asset-administration-shell-modification.payload";
import { AssetAdministrationShellModificationActivityCreateProps } from "./asset-administration-shell-base.activity";

export class AssetAdministrationShellModificationActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: AssetAdministrationShellModificationActivityPayload,
  ) {}
  static create(
    data: AssetAdministrationShellModificationActivityCreateProps,
  ): AssetAdministrationShellModificationActivity {
    return new AssetAdministrationShellModificationActivity(
      createActivityHeader(ActivityTypes.AssetAdministrationShellModification, data),
      data.payload,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new AssetAdministrationShellModificationActivity(
      ActivityHeader.fromPlain(parsed.header),
      AssetAdministrationShellModificationActivityPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain() {
    return activityToPlain(this);
  }
}
