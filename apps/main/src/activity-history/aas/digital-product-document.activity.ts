import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
  IActivityPayload,
} from "../activity";
import { ActivityTypes } from "../activity-types";
import { diff, IChange } from "json-diff-ts";
import { z } from "zod";
import {
  ActivityCreateProps,
  ActivityPayloadCreateProps,
  ActivityPayloadSchema,
  createActivityHeader,
} from "./shared.activity";
import {
  DigitalProductDocumentOperationTypesEnum,
  DigitalProductDocumentOperationTypesType,
} from "../digital-product-document-types";

export class DigitalProductDocumentActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: DigitalProductDocumentPayload,
  ) {}
  static create(
    data: ActivityCreateProps & {
      operation: DigitalProductDocumentOperationTypesType;
    },
  ) {
    return new DigitalProductDocumentActivity(
      createActivityHeader(ActivityTypes.DigitalProductDocumentActivity, data),
      DigitalProductDocumentPayload.create({
        changes: diff(data.oldData, data.newData),
        operation: data.operation,
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new DigitalProductDocumentActivity(
      ActivityHeader.fromPlain(parsed.header),
      DigitalProductDocumentPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain() {
    return activityToPlain(this);
  }
}

const DigitalProductDocumentPayloadSchema = z.object({
  ...ActivityPayloadSchema.omit({ administration: true }).shape,
  operation: DigitalProductDocumentOperationTypesEnum,
});

export class DigitalProductDocumentPayload implements IActivityPayload {
  private constructor(
    public readonly operation: DigitalProductDocumentOperationTypesType,
    public readonly changes: IChange[],
  ) {}

  static create(
    data: Omit<ActivityPayloadCreateProps, "administration"> & {
      operation: DigitalProductDocumentOperationTypesType;
    },
  ) {
    return new DigitalProductDocumentPayload(data.operation, data.changes);
  }

  static fromPlain(data: unknown) {
    const parsed = DigitalProductDocumentPayloadSchema.parse(data);
    return new DigitalProductDocumentPayload(parsed.operation, parsed.changes);
  }

  toPlain() {
    return {
      changes: this.changes,
      operation: this.operation,
    };
  }
}
