import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { DataTypeDef } from "../../../domain/common/data-type-def";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";

import { SubmodelBaseDoc } from "./submodel-base.schema";

@Schema({ _id: false })
export class RangeDoc extends SubmodelBaseDoc {
  @Prop({ required: true, enum: Object.values(DataTypeDef), type: String })
  valueType: DataTypeDef;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop()
  min?: string;

  @Prop()
  max?: string;
}

export const RangeSchema = SchemaFactory.createForClass(RangeDoc);
