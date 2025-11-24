import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { DataTypeDef } from "../../../domain/common/data-type-def";
import { ReferenceDoc, ReferenceSchema } from "../common/reference.schema";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";

import { SubmodelBaseDoc } from "./submodel-base.schema";

@Schema({ _id: false })
export class PropertyDoc extends SubmodelBaseDoc {
  @Prop({ required: true, enum: Object.values(DataTypeDef), type: String })
  valueType: DataTypeDef;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop()
  value?: string;

  @Prop({ type: ReferenceSchema })
  valueId?: ReferenceDoc;
}

export const PropertySchema = SchemaFactory.createForClass(PropertyDoc);
