import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "caps", timestamps: true })
export class CapDoc extends Document {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  limit: number;

  @Prop({ required: true })
  count: number;
}

export const CapSchema = SchemaFactory.createForClass(CapDoc);
