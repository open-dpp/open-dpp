import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { KeyTypes } from "../../../domain/common/key";

@Schema({ _id: false })
export class KeyDoc {
  @Prop({ required: true, enum: Object.values(KeyTypes), type: String })
  type: KeyTypes;

  @Prop({ required: true })
  value: string;
}

export const KeySchema = SchemaFactory.createForClass(KeyDoc);
