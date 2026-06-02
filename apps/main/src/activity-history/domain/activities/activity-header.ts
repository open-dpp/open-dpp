import { z } from "zod";
import { randomUUID } from "node:crypto";
import { LatestAasExportVersion } from "../../../aas/infrastructure/serialization/export-schemas/aas-export-shared";

export const ActivityHeaderSchema = z.object({
  id: z.string(),
  aggregateId: z.string(),
  correlationId: z.string().nullable(),
  createdAt: z.date(),
  type: z.string(),
  userId: z.string().nullable(),
  version: z.string(),
  exportVersion: z.string(),
});

export class ActivityHeader {
  public readonly exportVersion: string = LatestAasExportVersion;
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

  toPlain(): Record<string, unknown> {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      correlationId: this.correlationId,
      createdAt: this.createdAt.toISOString(),
      type: this.type,
      userId: this.userId,
      version: this.version,
      exportVersion: this.exportVersion,
    };
  }
}
