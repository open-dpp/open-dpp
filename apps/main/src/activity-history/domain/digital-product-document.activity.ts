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
  createActivityHeader,
  diff,
  ExtendedJsonPatchOperation,
  ExtendedJsonPatchOperationSchema,
} from "./shared.activity";
import {
  DigitalProductDocumentOperationTypesEnum,
  DigitalProductDocumentOperationTypesType,
} from "../digital-product-document-operation-types";

const DigitalProductDocumentActivityVersion = {
  v1_0_0: "1.0.0",
} as const;

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
      createActivityHeader(
        ActivityTypes.DigitalProductDocumentActivity,
        data,
        DigitalProductDocumentActivityVersion.v1_0_0,
      ),
      DigitalProductDocumentPayload.create({
        changes: diff(data.oldData, data.newData).map((op) => ({ ...op, dpp: {} })),
        command: { op: data.operation },
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

const CommandSchema = z.object({
  op: DigitalProductDocumentOperationTypesEnum,
});

export type Command = z.infer<typeof CommandSchema>;

const DigitalProductDocumentPayloadSchema = z.object({
  changes: ExtendedJsonPatchOperationSchema.array(),
  command: CommandSchema,
});

export class DigitalProductDocumentPayload implements IActivityPayload {
  private constructor(
    public readonly command: Command,
    public readonly changes: ExtendedJsonPatchOperation[],
  ) {}

  static create(data: { command: Command; changes: ExtendedJsonPatchOperation[] }) {
    return new DigitalProductDocumentPayload(data.command, data.changes);
  }

  static fromPlain(data: unknown) {
    const parsed = DigitalProductDocumentPayloadSchema.parse(data);
    return new DigitalProductDocumentPayload(parsed.command, parsed.changes);
  }

  toPlain() {
    return {
      changes: this.changes,
      command: this.command,
    };
  }
}
