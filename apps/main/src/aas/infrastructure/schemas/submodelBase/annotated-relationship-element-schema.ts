import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ReferenceDoc, ReferenceSchema } from "../common/reference.schema";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc, SubmodelBaseSchema } from "./submodel-base.schema";

@Schema({ _id: false })
export class AnnotatedRelationshipElementDoc extends SubmodelBaseDoc {
  @Prop({ required: true, type: ReferenceSchema })
  first: ReferenceDoc;

  @Prop({ required: true, type: ReferenceSchema })
  second: ReferenceDoc;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop({ type: [SubmodelBaseSchema], default: [] })
  annotations?: SubmodelBaseDoc[];
}

export const AnnotatedRelationshipElementSchema = SchemaFactory.createForClass(AnnotatedRelationshipElementDoc);
