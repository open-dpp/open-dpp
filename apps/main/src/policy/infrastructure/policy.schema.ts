import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import type { PolicyKey } from "../domain/policy-rules";

/**
 * Fields shared by every per-organization policy document. Not backed by a
 * collection of its own — `LimitDoc` and `QuotaDoc` each map to their own.
 */
@Schema()
export class PolicyDoc extends Document {
  @Prop({ required: true, type: String })
  key: PolicyKey;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  limit: number;
}
