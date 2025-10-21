import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc } from "./submodel.schema";

@Schema({ _id: false })
export class PropertyDoc extends SubmodelBaseDoc {
  @Prop({ required: true, enum: DataTypeDef })
  valueType: DataTypeDef;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop()
  value?: string;

  @Prop({ type: ReferenceSchema })
  valueId?: ReferenceDoc;
}

export const PropertySchema = SchemaFactory.createForClass(PropertyDoc);
