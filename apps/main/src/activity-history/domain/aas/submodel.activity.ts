import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
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
  ExtendedJsonPatchOperation,
  ExtendedJsonPatchOperationSchema,
  JsonPatchOperation,
} from "../shared.activity";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { AdministrativeInformationJsonSchema, Permissions } from "@open-dpp/dto";
import { unescapePathComponent } from "fast-json-patch/commonjs/helpers";
import { RegexFilter } from "./regex-filter";

interface SubmodelActivityPlainOptions extends ConvertToPlainOptions {
  filter?: { dppPath?: string };
}

const SubmodelActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

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
      position?: number;
    },
  ) {
    return new SubmodelActivity(
      createActivityHeader(ActivityTypes.SubmodelActivity, data, SubmodelActivityVersion.v1_0_0),
      SubmodelPayload.create({
        submodelId: data.submodelId,
        administration: data.administration,
        command: {
          op: data.operation,
          path: data.fullIdShortPath,
          ...(data.position || data.additionalIdShort
            ? { value: { pos: data.position, aId: data.additionalIdShort } }
            : {}),
        },
        changes: diff(data.oldData, data.newData).map((op) =>
          extendOperationBySubmodelInformation(op, data.oldData, data.newData),
        ),
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

  toPlain(options?: SubmodelActivityPlainOptions) {
    if (options?.ability) {
      if (!options.ability.can(Permissions.Read, this.payload.command.path)) {
        return {
          header: this.header.toPlain(),
          payload: {
            error: {
              status: 403,
              message: `Missing read permission to access activity payload for resource with idShort path ${this.payload.command.path}`,
            },
          },
        };
      }
    }
    return {
      header: this.header.toPlain(),
      payload: this.payload.toPlain(options),
    };
  }
}

const CommandSchema = z.object({
  op: SubmodelOperationTypesEnum,
  path: z.string(),
  value: z.record(z.string(), z.any()).optional(),
});

type Command = {
  op: SubmodelOperationTypesType;
  path: IdShortPath;
  value?: Record<string, unknown>;
};

const SubmodelPayloadSchema = z.object({
  submodelId: z.string(),
  administration: AdministrativeInformationJsonSchema,
  changes: ExtendedJsonPatchOperationSchema.array(),
  command: CommandSchema,
});

export class SubmodelPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly administration: AdministrativeInformation,
    public readonly command: Command,
    public readonly changes: Array<ExtendedJsonPatchOperation>,
  ) {}

  static create(data: {
    administration: AdministrativeInformation;
    changes: Array<ExtendedJsonPatchOperation>;
    command: Command;
    submodelId: string;
  }) {
    return new SubmodelPayload(data.submodelId, data.administration, data.command, data.changes);
  }

  static fromPlain(data: unknown) {
    const parsed = SubmodelPayloadSchema.parse(data);
    return new SubmodelPayload(
      parsed.submodelId,
      AdministrativeInformation.fromPlain(parsed.administration),
      { ...parsed.command, path: IdShortPath.create({ path: parsed.command.path }) },
      parsed.changes,
    );
  }

  toPlain(options?: SubmodelActivityPlainOptions) {
    const dppPath = options?.filter?.dppPath;
    let filteredChanges = this.changes;
    if (dppPath) {
      filteredChanges = this.changes.filter((c) => RegexFilter.create(dppPath).test(c.dpp.p));
    }

    return {
      administration: this.administration.toPlain(),
      changes: filteredChanges,
      submodelId: this.submodelId,
      command: { ...this.command, path: this.command.path.toString() },
    };
  }
}

function extendOperationBySubmodelInformation(
  operation: JsonPatchOperation,
  oldData: any,
  newData: any,
): ExtendedJsonPatchOperation {
  const tokens = operation.path.split("/").slice(1).map(unescapePathComponent);
  const aasSegments: string[] = [];
  let current = operation.op === "add" ? newData : oldData;

  let element: any;

  for (const token of tokens) {
    current = current[token];
    if (current && typeof current === "object" && current.idShort) {
      element = current;
      aasSegments.push(current.idShort);
    }
  }
  const dppKey: {
    p?: string;
    m?: string;
    v?: string;
  } = {};
  if (aasSegments.length > 0) {
    dppKey.p = aasSegments.join(".");
  }

  if (element && element.modelType) {
    dppKey.m = element.modelType;
  }
  if (element && element.valueType) {
    dppKey.v = element.valueType;
  }

  return {
    ...operation,
    dpp: dppKey,
  };
}
