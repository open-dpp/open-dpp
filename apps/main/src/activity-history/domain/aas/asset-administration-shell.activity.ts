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
import { z } from "zod";
import {
  ActivityCreatePropsWithAdministration,
  createActivityHeader,
  diff,
  ExtendedJsonPatchOperation,
  ExtendedJsonPatchOperationSchema,
  JsonPatchOperation,
} from "../shared.activity";
import {
  AssetAdministrationShellOperationTypesEnum,
  AssetAdministrationShellOperationTypesType,
} from "../../asset-administration-shell-operation-types";
import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";
import { unescapePathComponent } from "fast-json-patch/commonjs/helpers";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";

const AssetAdministrationShellActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

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
    return new AssetAdministrationShellActivity(
      createActivityHeader(
        ActivityTypes.AssetAdministrationShellActivity,
        data,
        AssetAdministrationShellActivityVersion.v1_0_0,
      ),
      AssetAdministrationShellPayload.create({
        assetAdministrationShellId: data.assetAdministrationShellId,
        administration: data.administration,
        changes: diff(data.oldData, data.newData).map((op) =>
          extendOperationByAasInformation(op, data.oldData, data.newData),
        ),
        command: { op: data.operation },
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

const CommandSchema = z.object({
  op: AssetAdministrationShellOperationTypesEnum,
});

const AssetAdministrationShellPayloadSchema = z.object({
  administration: AdministrativeInformationJsonSchema,
  command: CommandSchema,
  changes: ExtendedJsonPatchOperationSchema.array(),
  assetAdministrationShellId: z.string(),
});

type Command = z.infer<typeof CommandSchema>;

export class AssetAdministrationShellPayload implements IActivityPayload {
  private constructor(
    public readonly assetAdministrationShellId: string,
    public readonly administration: AdministrativeInformation,
    public readonly command: Command,
    public readonly changes: ExtendedJsonPatchOperation[],
  ) {}

  static create(data: {
    administration: AdministrativeInformation;
    assetAdministrationShellId: string;
    command: Command;
    changes: ExtendedJsonPatchOperation[];
  }) {
    return new AssetAdministrationShellPayload(
      data.assetAdministrationShellId,
      data.administration,
      data.command,
      data.changes,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = AssetAdministrationShellPayloadSchema.parse(data);
    return new AssetAdministrationShellPayload(
      parsed.assetAdministrationShellId,
      AdministrativeInformation.fromPlain(parsed.administration),
      parsed.command,
      parsed.changes,
    );
  }

  toPlain() {
    return {
      administration: this.administration.toPlain(),
      changes: this.changes,
      assetAdministrationShellId: this.assetAdministrationShellId,
      command: this.command,
    };
  }
}

function extendOperationByAasInformation(
  operation: JsonPatchOperation,
  oldData: any,
  newData: any,
): ExtendedJsonPatchOperation {
  if (!operation.path.startsWith("/security")) {
    return {
      ...operation,
      dpp: {},
    };
  }
  const getSubjectAttributeValue = (
    attributes: Array<{ idShort: string; value: string }>,
    key: string,
  ): string | undefined => {
    return attributes.find((attribute) => attribute.idShort === key)?.value;
  };

  const tokens = operation.path.split("/").slice(1).map(unescapePathComponent);
  let objectIdShort: string | undefined;
  let userRole: string | undefined;
  let memberRole: string | undefined;
  let current = operation.op === "add" ? newData : oldData;

  for (const token of tokens) {
    current = current[token];

    if (!current || typeof current !== "object") {
      continue;
    }

    if (current.object?.idShort) {
      objectIdShort = current.object.idShort;
    }

    const attributes = current.targetSubjectAttributes?.subjectAttribute;
    if (!Array.isArray(attributes)) {
      continue;
    }

    userRole = getSubjectAttributeValue(attributes, SubjectAttributes.UserRoleKey);
    memberRole = getSubjectAttributeValue(attributes, SubjectAttributes.MemberRoleKey);
  }

  const dppKey: {
    o?: string;
    u?: string;
    m?: string;
  } = {};
  if (objectIdShort) {
    dppKey.o = objectIdShort;
  }
  if (userRole) {
    dppKey.u = userRole;
  }
  if (memberRole) {
    dppKey.m = memberRole;
  }

  return {
    ...operation,
    dpp: dppKey,
  };
}
