import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
  IActivityPayload,
} from "../activity";
import { ActivityTypes } from "../activity-types";
import { z } from "zod";
import { ActivityHeaderCreateProps, createActivityHeader } from "./shared.activity";
import {
  SubmodelRepositoryOperationTypesEnum,
  SubmodelRepositoryOperationTypesType,
} from "../submodel-repository-operation-types";
import { Submodel } from "../../aas/domain/submodel-base/submodel";

const SubmodelRepositoryActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class SubmodelRepositoryActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelRepositoryPayload,
  ) {}
  static create(
    data: ActivityHeaderCreateProps & {
      operation: SubmodelRepositoryOperationTypesType;
      submodel: Submodel;
    },
  ) {
    return new SubmodelRepositoryActivity(
      createActivityHeader(
        ActivityTypes.SubmodelRepositoryActivity,
        data,
        SubmodelRepositoryActivityVersion.v1_0_0,
      ),
      SubmodelRepositoryPayload.create({
        submodel: data.submodel,
        command: {
          op: data.operation,
        },
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelRepositoryActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelRepositoryPayload.fromPlain(parsed.payload),
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
  op: SubmodelRepositoryOperationTypesEnum,
});

export type Command = z.infer<typeof CommandSchema>;

const SubmodelRepositoryPayloadSchema = z.object({
  command: CommandSchema,
  changes: z.json(),
});

export class SubmodelRepositoryPayload implements IActivityPayload {
  private constructor(
    public readonly command: Command,
    public readonly changes: any,
  ) {}

  static create(data: { command: Command; submodel: Submodel }) {
    return new SubmodelRepositoryPayload(data.command, data.submodel.toPlain());
  }

  static fromPlain(data: unknown) {
    const parsed = SubmodelRepositoryPayloadSchema.parse(data);
    return new SubmodelRepositoryPayload(parsed.command, parsed.changes);
  }

  toPlain() {
    return {
      changes: this.changes,
      command: this.command,
    };
  }
}
