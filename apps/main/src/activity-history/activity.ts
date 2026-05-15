import { z } from "zod";
import { IConvertableToPlain } from "../aas/domain/convertable-to-plain";
import { ActivityTypesEnum } from "./activity-types";
import { getActivityClass } from "./activity-registry";
import { randomUUID } from "node:crypto";

export const ActivityHeaderSchema = z.object({
  id: z.string(),
  aggregateId: z.string(),
  correlationId: z.string().nullable(),
  createdAt: z.date(),
  type: z.string(),
  userId: z.string().nullable(),
  version: z.string(),
});

export const ActivitySchema = z.object({
  header: ActivityHeaderSchema,
  payload: z.any(),
});

export class ActivityHeader {
  private constructor(
    public readonly id: string,
    public readonly aggregateId: string,
    private _correlationId: string | null,
    public readonly createdAt: Date,
    public readonly type: string,
    public readonly userId: string | null,
    public readonly version: string,
  ) {}

  get correlationId(): string | null {
    return this._correlationId;
  }

  static create(data: {
    id?: string;
    aggregateId: string;
    correlationId?: string;
    createdAt?: Date;
    type: string;
    userId?: string;
    version: string;
  }) {
    return new ActivityHeader(
      data.id ?? randomUUID(),
      data.aggregateId,
      data.correlationId ?? null,
      data.createdAt ?? new Date(),
      data.type,
      data.userId ?? null,
      data.version,
    );
  }

  static fromPlain(data: unknown): ActivityHeader {
    const parsed = ActivityHeaderSchema.parse(data);
    return new ActivityHeader(
      parsed.id,
      parsed.aggregateId,
      parsed.correlationId,
      parsed.createdAt,
      parsed.type,
      parsed.userId,
      parsed.version,
    );
  }

  assignCorrelationId(correlationId: string) {
    this._correlationId = correlationId;
  }

  toPlain(): Record<string, unknown> {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      correlationId: this.correlationId,
      createdAt: this.createdAt,
      type: this.type,
      userId: this.userId,
      version: this.version,
    };
  }
}

export interface IActivityPayload extends IConvertableToPlain {}

export function activityToDatabase(event: IActivity) {
  return {
    ...event.header.toPlain(),
    _id: event.header.id,
    payload: event.payload.toPlain(),
  };
}

export function activityToPlain(event: IActivity) {
  return {
    header: event.header.toPlain(),
    payload: event.payload.toPlain(),
  };
}

export interface IActivity extends IConvertableToPlain {
  header: ActivityHeader;
  payload: IActivityPayload;
  toDatabase: () => Record<string, any>;
}

export function parseActivity(activity: any): IActivity {
  const schema = z.object({ header: z.object({ type: ActivityTypesEnum }) });
  const ActivityClass = getActivityClass(schema.parse(activity).header.type);
  return ActivityClass.fromPlain(activity);
}
