import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { PolicyKey } from "../domain/policy";

@Schema({ collection: "caps", timestamps: true })
export class CapDoc extends Document {
  @Prop({ required: true, type: Number, enum: PolicyKey })
  key: PolicyKey;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  limit: number;

  @Prop({ required: true })
  count: number;
}

export const CapSchema = SchemaFactory.createForClass(CapDoc);
