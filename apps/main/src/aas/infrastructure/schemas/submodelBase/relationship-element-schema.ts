import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc } from "./submodel.schema";

@Schema({ _id: false })
export class RelationshipElementDoc extends SubmodelBaseDoc {
  @Prop({ required: true, type: ReferenceSchema })
  first: string;

  @Prop({ required: true, type: ReferenceSchema })
  second: string;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];
}

export const RelationshipElementSchema = SchemaFactory.createForClass(RelationshipElementDoc);
