import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc } from "./submodel.schema";

export class RangeDoc extends SubmodelBaseDoc {
  @Prop({ required: true, enum: DataTypeDef })
  valueType: DataTypeDef;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop()
  min?: string;

  @Prop()
  max?: string;
}

export const RangeSchema = SchemaFactory.createForClass(RangeDoc);
