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
import {
  ActivityCreateProps,
  ActivityPayloadCreateProps,
  ActivityPayloadSchema,
  createActivityHeader,
  diff,
} from "./shared.activity";
import { EnvironmentOperationTypesEnum, EnvironmentOperationTypesType } from "../environment-types";
import { Operation } from "fast-json-patch/module/core";

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
      createActivityHeader(ActivityTypes.EnvironmentActivity, data),
      EnvironmentPayload.create({
        changes: diff(data.oldData, data.newData),
        operation: data.operation,
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

const EnvironmentPayloadSchema = z.object({
  ...ActivityPayloadSchema.omit({ administration: true }).shape,
  operation: EnvironmentOperationTypesEnum,
});

export class EnvironmentPayload implements IActivityPayload {
  private constructor(
    public readonly operation: EnvironmentOperationTypesType,
    public readonly changes: Operation[],
  ) {}

  static create(
    data: Omit<ActivityPayloadCreateProps, "administration"> & {
      operation: EnvironmentOperationTypesType;
    },
  ) {
    return new EnvironmentPayload(data.operation, data.changes);
  }

  static fromPlain(data: unknown) {
    const parsed = EnvironmentPayloadSchema.parse(data);
    return new EnvironmentPayload(parsed.operation, parsed.changes);
  }

  toPlain() {
    return {
      changes: this.changes,
      operation: this.operation,
    };
  }
}
