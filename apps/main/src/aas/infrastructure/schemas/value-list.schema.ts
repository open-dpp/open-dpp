import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ValueReferencePairDoc, ValueReferencePairSchema } from "./value-reference-pair";

@Schema({ _id: false })
export class ValueListDoc {
  @Prop({ type: [ValueReferencePairSchema], required: true, default: [] })
  valueReferencePairs: ValueReferencePairDoc[];
}

export const ValueListSchema = SchemaFactory.createForClass(ValueListDoc);
