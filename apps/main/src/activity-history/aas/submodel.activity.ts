import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
  IActivityPayload,
} from "../activity";
import { ActivityTypes } from "../activity-types";
import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { diff, IChange, Operation } from "json-diff-ts";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { OperationTypesEnum, OperationTypesType } from "../operation-types";

export class SubmodelActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelPayload,
  ) {}
  static create(data: {
    digitalProductDocumentId: string;
    submodelId: string;
    administration: AdministrativeInformation;
    fullIdShortPath: IdShortPath;
    oldData: unknown;
    newData: unknown;
    operation: OperationTypesType;
    userId?: string;
    createdAt?: Date;
  }) {
    const embeddedObjKeys = new Map();
    embeddedObjKeys.set(/.*value/, "idShort");
    embeddedObjKeys.set("submodelElements", "idShort");
    return new SubmodelActivity(
      ActivityHeader.create({
        type: ActivityTypes.SubmodelActivity,
        version: "1.0.0",
        aggregateId: data.digitalProductDocumentId,
        userId: data.userId,
        createdAt: data.createdAt,
      }),
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

const ChangeSchema = z.object({
  type: z.enum(Operation),
  key: z.string(),
  embeddedKey: z.string().optional(),
  /** When true, embeddedKey is a dot-separated nested path (e.g. "a.b" → @.a.b). */
  embeddedKeyIsPath: z.boolean().optional(),
  value: z.any().optional(),
  oldValue: z.any().optional(),
  get changes() {
    return ChangeSchema.array().optional();
  },
});

const SubmodelPayloadSchema = z.object({
  submodelId: z.string(),
  administration: AdministrativeInformationJsonSchema,
  fullIdShortPath: z.string(),
  operation: OperationTypesEnum,
  changes: ChangeSchema.array(),
});

export class SubmodelPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly administration: AdministrativeInformation,
    public readonly fullIdShortPath: IdShortPath,
    public readonly operation: OperationTypesType,
    public readonly changes: IChange[],
  ) {}

  static create(data: {
    submodelId: string;
    administration: AdministrativeInformation;
    fullIdShortPath: IdShortPath;
    operation: OperationTypesType;
    changes: IChange[];
  }) {
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
      submodelId: this.submodelId,
      administration: this.administration.toPlain(),
      fullIdShortPath: this.fullIdShortPath.toString(),
      operation: this.operation,
      changes: this.changes,
    };
  }
}
