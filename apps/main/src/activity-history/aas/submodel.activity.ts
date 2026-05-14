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
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { z } from "zod";
import {
  SubmodelOperationTypes,
  SubmodelOperationTypesEnum,
  SubmodelOperationTypesType,
} from "../submodel-operation-types";
import {
  ActivityCreateProps,
  ActivityPayloadCreateProps,
  ActivityPayloadSchema,
  createActivityHeader,
  payloadToPlain,
} from "./shared.activity";

export class SubmodelActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelPayload,
  ) {}
  static create(
    data: ActivityCreateProps & {
      submodelId: string;
      operation: SubmodelOperationTypesType;
      fullIdShortPath: IdShortPath;
    },
  ) {
    const embeddedObjKeys = new Map();
    const valueMatcher =
      data.operation === SubmodelOperationTypes.SubmodelRowCreate ? /.+\.value$/ : /(^|\.)value$/;
    embeddedObjKeys.set(valueMatcher, "idShort");
    embeddedObjKeys.set(/(^|\.)displayName$/, "language");
    embeddedObjKeys.set("submodelElements", "idShort");
    return new SubmodelActivity(
      createActivityHeader(ActivityTypes.SubmodelActivity, data),
      SubmodelPayload.create({
        submodelId: data.submodelId,
        administration: data.administration,
        fullIdShortPath: data.fullIdShortPath,
        changes: diff(data.oldData, data.newData, { embeddedObjKeys }),
        operation: data.operation,
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain() {
    return activityToPlain(this);
  }
}

const SubmodelPayloadSchema = z.object({
  ...ActivityPayloadSchema.shape,
  submodelId: z.string(),
  operation: SubmodelOperationTypesEnum,
  fullIdShortPath: z.string(),
});

export class SubmodelPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly administration: AdministrativeInformation,
    public readonly fullIdShortPath: IdShortPath,
    public readonly operation: SubmodelOperationTypesType,
    public readonly changes: IChange[],
  ) {}

  static create(
    data: ActivityPayloadCreateProps & {
      submodelId: string;
      operation: SubmodelOperationTypesType;
      fullIdShortPath: IdShortPath;
    },
  ) {
    return new SubmodelPayload(
      data.submodelId,
      data.administration,
      data.fullIdShortPath,
      data.operation,
      data.changes,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = SubmodelPayloadSchema.parse(data);
    return new SubmodelPayload(
      parsed.submodelId,
      AdministrativeInformation.fromPlain(parsed.administration),
      IdShortPath.create({ path: parsed.fullIdShortPath }),
      parsed.operation,
      parsed.changes,
    );
  }

  toPlain() {
    return {
      ...payloadToPlain(this),
      submodelId: this.submodelId,
      operation: this.operation,
      fullIdShortPath: this.fullIdShortPath.toString(),
    };
  }
}
