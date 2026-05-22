import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
  IActivityPayload,
} from "../../activity";
import { ActivityTypes } from "../../activity-types";
import { z } from "zod";
import {
  ActivityCreateProps,
  createActivityHeader,
  diff,
  ExtendedJsonPatchOperation,
  ExtendedJsonPatchOperationSchema,
} from "../shared.activity";
import {
  EnvironmentOperationTypesEnum,
  EnvironmentOperationTypesType,
} from "../../environment-types";

const EnvironmentActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

export class EnvironmentActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: EnvironmentPayload,
  ) {}
  static create(
    data: ActivityCreateProps & {
      operation: EnvironmentOperationTypesType;
    },
  ) {
    return new EnvironmentActivity(
      createActivityHeader(
        ActivityTypes.EnvironmentActivity,
        data,
        EnvironmentActivityVersion.v1_0_0,
      ),
      EnvironmentPayload.create({
        changes: diff(data.oldData, data.newData).map((op) => ({ ...op, dpp: {} })),
        command: { op: data.operation },
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new EnvironmentActivity(
      ActivityHeader.fromPlain(parsed.header),
      EnvironmentPayload.fromPlain(parsed.payload),
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
  op: EnvironmentOperationTypesEnum,
});

export type Command = z.infer<typeof CommandSchema>;

const EnvironmentPayloadSchema = z.object({
  changes: ExtendedJsonPatchOperationSchema.array(),
  command: CommandSchema,
});

export class EnvironmentPayload implements IActivityPayload {
  private constructor(
    public readonly command: Command,
    public readonly changes: ExtendedJsonPatchOperation[],
  ) {}

  static create(data: { changes: ExtendedJsonPatchOperation[]; command: Command }) {
    return new EnvironmentPayload(data.command, data.changes);
  }

  static fromPlain(data: unknown) {
    const parsed = EnvironmentPayloadSchema.parse(data);
    return new EnvironmentPayload(parsed.command, parsed.changes);
  }

  toPlain() {
    return {
      changes: this.changes,
      command: this.command,
    };
  }
}
