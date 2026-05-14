import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
  IActivityPayload,
} from "../activity";
import { ActivityTypes } from "../activity-types";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { diff, IChange } from "json-diff-ts";
import { z } from "zod";
import {
  ActivityCreatePropsWithAdministration,
  ActivityPayloadCreateProps,
  ActivityPayloadSchema,
  createActivityHeader,
  payloadToPlain,
} from "./shared.activity";
import {
  AssetAdministrationShellOperationTypesEnum,
  AssetAdministrationShellOperationTypesType,
} from "../asset-administration-shell-operation-types";

export class AssetAdministrationShellActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: AssetAdministrationShellPayload,
  ) {}
  static create(
    data: ActivityCreatePropsWithAdministration & {
      assetAdministrationShellId: string;
      operation: AssetAdministrationShellOperationTypesType;
    },
  ) {
    const embeddedObjKeys = new Map();
    embeddedObjKeys.set(/(^|\.)permissionsPerObject$/, "object.idShort");
    embeddedObjKeys.set(/(^|\.)permissions$/, "permission");
    return new AssetAdministrationShellActivity(
      createActivityHeader(ActivityTypes.AssetAdministrationShellActivity, data),
      AssetAdministrationShellPayload.create({
        assetAdministrationShellId: data.assetAdministrationShellId,
        administration: data.administration,
        changes: diff(data.oldData, data.newData, { embeddedObjKeys }),
        operation: data.operation,
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new AssetAdministrationShellActivity(
      ActivityHeader.fromPlain(parsed.header),
      AssetAdministrationShellPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain() {
    return activityToPlain(this);
  }
}

const AssetAdministrationShellPayloadSchema = z.object({
  ...ActivityPayloadSchema.shape,
  assetAdministrationShellId: z.string(),
  operation: AssetAdministrationShellOperationTypesEnum,
});

export class AssetAdministrationShellPayload implements IActivityPayload {
  private constructor(
    public readonly assetAdministrationShellId: string,
    public readonly administration: AdministrativeInformation,
    public readonly operation: AssetAdministrationShellOperationTypesType,
    public readonly changes: IChange[],
  ) {}

  static create(
    data: ActivityPayloadCreateProps & {
      assetAdministrationShellId: string;
      operation: AssetAdministrationShellOperationTypesType;
    },
  ) {
    return new AssetAdministrationShellPayload(
      data.assetAdministrationShellId,
      data.administration,
      data.operation,
      data.changes,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = AssetAdministrationShellPayloadSchema.parse(data);
    return new AssetAdministrationShellPayload(
      parsed.assetAdministrationShellId,
      AdministrativeInformation.fromPlain(parsed.administration),
      parsed.operation,
      parsed.changes,
    );
  }

  toPlain() {
    return {
      ...payloadToPlain(this),
      assetAdministrationShellId: this.assetAdministrationShellId,
      operation: this.operation,
    };
  }
}
