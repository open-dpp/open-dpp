import type { QuotaPeriod } from "../domain/quota";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CapDoc } from "./cap.schema";

@Schema({ collection: "quotas", timestamps: true })
export class QuotaDoc extends CapDoc {
  @Prop({ required: true, type: String })
  period: QuotaPeriod;

  @Prop({ required: true })
  lastSetBack: Date;
}

export const QuotaSchema = SchemaFactory.createForClass(QuotaDoc);
