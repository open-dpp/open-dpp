import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ReferenceDoc, ReferenceSchema } from "./common/reference.schema";

@Schema({ _id: false })
export class ValueReferencePairDoc {
  @Prop({ required: true })
  value: string;

  @Prop({ required: true, type: ReferenceSchema })
  valueId: ReferenceDoc;
}

export const ValueReferencePairSchema = SchemaFactory.createForClass(ValueReferencePairDoc);
