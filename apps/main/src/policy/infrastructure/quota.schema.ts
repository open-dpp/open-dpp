import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { QuotaPeriod } from "../domain/quota";
import { CapDoc } from "./cap.schema";

@Schema({ collection: "quotas", timestamps: true })
export class QuotaDoc extends CapDoc {
  @Prop({ required: true })
  period: QuotaPeriod;

  @Prop({ required: true })
  lastSetBack: Date;
}

export const QuotaSchema = SchemaFactory.createForClass(QuotaDoc);
