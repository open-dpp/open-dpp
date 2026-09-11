import { Prop, Schema } from "@nestjs/mongoose";
import type { PolicyKey } from "@open-dpp/dto";
import { Document } from "mongoose";

export const PolicyDocSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;
export type PolicyDocSchemaVersionType =
  (typeof PolicyDocSchemaVersion)[keyof typeof PolicyDocSchemaVersion];

/**
 * Fields shared by every per-organization policy document. Not backed by a
 * collection of its own — `LimitDoc` and `QuotaDoc` each map to their own.
 */
@Schema()
export class PolicyDoc extends Document {
  @Prop({ required: true, type: String, enum: Object.values(PolicyDocSchemaVersion) })
  _schemaVersion: PolicyDocSchemaVersionType;

  @Prop({ required: true, type: String })
  key: PolicyKey;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  limit: number;
}
