import type { DppStatusType } from "../domain/dpp-status";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { DppStatus } from "../domain/dpp-status";

@Schema({ id: false })
export class DppStatusChangeDoc {
  @Prop({ enum: Object.values(DppStatus), type: String, required: false })
  previousStatus: DppStatusType | null;

  @Prop({ enum: Object.values(DppStatus), type: String, required: false })
  currentStatus: DppStatusType | null;
}

export const DppStatusChangeDbSchema = SchemaFactory.createForClass(DppStatusChangeDoc);
