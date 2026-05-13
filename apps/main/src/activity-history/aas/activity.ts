import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
  IActivityPayload,
} from "../activity";
import { ActivityTypesType } from "../activity-types";
import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { diff } from "json-diff-ts";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ICommand } from "../../commands/command.interface";

export class SubmodelActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelPayload,
  ) {}
  static create(data: {
    digitalProductDocumentId: string;
    submodelId: string;
    administration: AdministrativeInformation;
    type: ActivityTypesType;
    fullIdShortPath: IdShortPath;
    oldData: unknown;
    newData: unknown;
    command: ICommand;
  }) {
    const embeddedObjKeys = new Map();
    embeddedObjKeys.set(/.*value/, "idShort");
    embeddedObjKeys.set("submodelElements", "idType");
    return new SubmodelActivity(
      ActivityHeader.create({
        type: data.type,
        version: "1.0.0",
        aggregateId: data.digitalProductDocumentId,
        userId: data.command.getUserId() ?? undefined,
        createdAt: data.command.createdAt,
      }),
      SubmodelPayload.create({
        submodelId: data.submodelId,
        administration: data.administration,
        fullIdShortPath: data.fullIdShortPath,
        changes: diff(data.oldData, data.newData, { embeddedObjKeys }),
        command: data.command,
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
  submodelId: z.string(),
  administration: AdministrativeInformationJsonSchema,
  fullIdShortPath: z.string(),
  command: z.unknown(),
  changes: z.unknown(),
});

class SubmodelPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly administration: AdministrativeInformation,
    public readonly fullIdShortPath: IdShortPath,
    public readonly command: unknown,
    public readonly changes: unknown,
  ) {}

  static create(data: {
    submodelId: string;
    administration: AdministrativeInformation;
    fullIdShortPath: IdShortPath;
    command: ICommand;
    changes: unknown;
  }) {
    return new SubmodelPayload(
      data.submodelId,
      data.administration,
      data.fullIdShortPath,
      data.command.toPlainForActivity(),
      data.changes,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = SubmodelPayloadSchema.parse(data);
    return new SubmodelPayload(
      parsed.submodelId,
      AdministrativeInformation.fromPlain(parsed.administration),
      IdShortPath.create({ path: parsed.fullIdShortPath }),
      parsed.command,
      parsed.changes,
    );
  }

  toPlain() {
    return {
      submodelId: this.submodelId,
      administration: this.administration.toPlain(),
      fullIdShortPath: this.fullIdShortPath.toString(),
      command: this.command,
      changes: this.changes,
    };
  }
}
