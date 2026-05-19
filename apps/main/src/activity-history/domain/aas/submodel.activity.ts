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
  createActivityHeader,
  diff,
  JsonPatchOperationWithAas,
  OperationWithAasSchema,
  JsonPatchOperation,
} from "../shared.activity";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { AdministrativeInformationJsonSchema, Permissions } from "@open-dpp/dto";
import { unescapePathComponent } from "fast-json-patch/module/helpers";

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
      additionalIdShort?: string;
    },
  ) {
    return new SubmodelActivity(
      createActivityHeader(ActivityTypes.SubmodelActivity, data),
      SubmodelPayload.create({
        submodelId: data.submodelId,
        administration: data.administration,
        fullIdShortPath: data.fullIdShortPath,
        additionalIdShort: data.additionalIdShort,
        changes: diff(data.oldData, data.newData).map((op) =>
          extendOperationBySubmodelInformation(op, data.oldData, data.newData),
        ),
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

  toPlain(options?: ConvertToPlainOptions) {
    if (options?.ability) {
      if (!options.ability.can(Permissions.Read, this.payload.fullIdShortPath)) {
        return {
          ...activityToPlain(this),
          payload: {
            error: {
              status: 403,
              message: `Missing read permission to access activity payload for resource with idShort path ${this.payload.fullIdShortPath}`,
            },
          },
        };
      }
    }
    return activityToPlain(this);
  }
}

const SubmodelPayloadSchema = z.object({
  administration: AdministrativeInformationJsonSchema,
  changes: OperationWithAasSchema.array(),
  submodelId: z.string(),
  operation: SubmodelOperationTypesEnum,
  fullIdShortPath: z.string(),
  additionalIdShort: z.string().nullable(),
});

export class SubmodelPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly administration: AdministrativeInformation,
    public readonly fullIdShortPath: IdShortPath,
    public readonly additionalIdShort: string | null,
    public readonly operation: SubmodelOperationTypesType,
    public readonly changes: Array<JsonPatchOperationWithAas>,
  ) {}

  static create(data: {
    administration: AdministrativeInformation;
    changes: Array<JsonPatchOperationWithAas>;
    submodelId: string;
    operation: SubmodelOperationTypesType;
    fullIdShortPath: IdShortPath;
    additionalIdShort?: string;
  }) {
    return new SubmodelPayload(
      data.submodelId,
      data.administration,
      data.fullIdShortPath,
      data.additionalIdShort ?? null,
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
      parsed.additionalIdShort ?? null,
      parsed.operation,
      parsed.changes,
    );
  }

  toPlain() {
    return {
      administration: this.administration.toPlain(),
      changes: this.changes,
      submodelId: this.submodelId,
      operation: this.operation,
      fullIdShortPath: this.fullIdShortPath.toString(),
      additionalIdShort: this.additionalIdShort,
    };
  }
}

function extendOperationBySubmodelInformation(
  operation: JsonPatchOperation,
  oldData: any,
  newData: any,
): JsonPatchOperationWithAas {
  const tokens = operation.path.split("/").slice(1).map(unescapePathComponent);
  const aasSegments: string[] = [];
  let current = operation.op === "add" ? newData : oldData;

  for (const token of tokens) {
    current = current[token];
    if (current && typeof current === "object" && current.idShort) {
      aasSegments.push(current.idShort);
    }
  }
  return {
    ...operation,
    aas: aasSegments.join("."),
  };
}
