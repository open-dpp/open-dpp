import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
  IActivityPayload,
} from "../../activity";
import { ActivityTypes } from "../../activity-types";
import { AdministrativeInformation } from "../../../aas/domain/common/administrative-information";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod";
import {
  SubmodelOperationTypesEnum,
  SubmodelOperationTypesType,
} from "../../submodel-operation-types";
import {
  ActivityCreatePropsWithAdministration,
  ActivityPayloadCreateProps,
  ActivityPayloadSchema,
  createActivityHeader,
  diff,
  payloadToPlain,
} from "../shared.activity";
import { Operation } from "fast-json-patch/module/core";

export class SubmodelActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelPayload,
  ) {}
  static create(
    data: ActivityCreatePropsWithAdministration & {
      submodelId: string;
      operation: SubmodelOperationTypesType;
      fullIdShortPath: IdShortPath;
    },
  ) {
    return new SubmodelActivity(
      createActivityHeader(ActivityTypes.SubmodelActivity, data),
      SubmodelPayload.create({
        submodelId: data.submodelId,
        administration: data.administration,
        fullIdShortPath: data.fullIdShortPath,
        changes: diff(data.oldData, data.newData),
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
    public readonly changes: Operation[],
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
