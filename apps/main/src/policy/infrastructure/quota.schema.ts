import type { QuotaPeriod } from "../domain/quota";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { PolicyDoc } from "./policy.schema";

@Schema({ collection: "quotas", timestamps: true })
export class QuotaDoc extends PolicyDoc {
  @Prop({ required: true })
  count: number;

  @Prop({ required: true, type: String })
  period: QuotaPeriod;

  @Prop({ required: true })
  lastSetBack: Date;
}

export const QuotaSchema = SchemaFactory.createForClass(QuotaDoc);
