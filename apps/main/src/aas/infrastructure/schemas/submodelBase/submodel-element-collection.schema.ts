import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc, SubmodelBaseSchema } from "./submodel-base.schema";

@Schema({ _id: false })
export class SubmodelElementCollectionDoc extends SubmodelBaseDoc {
  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop({ type: [SubmodelBaseSchema], default: [] })
  value?: SubmodelBaseDoc[];
}

export const SubmodelElementCollectionSchema = SchemaFactory.createForClass(SubmodelElementCollectionDoc);
