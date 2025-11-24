import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ReferenceDoc, ReferenceSchema } from "../common/reference.schema";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";

import { SubmodelBaseDoc } from "./submodel-base.schema";

@Schema({ _id: false })
export class RelationshipElementDoc extends SubmodelBaseDoc {
  @Prop({ required: true, type: ReferenceSchema })
  first: ReferenceDoc;

  @Prop({ required: true, type: ReferenceSchema })
  second: ReferenceDoc;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];
}

export const RelationshipElementSchema = SchemaFactory.createForClass(RelationshipElementDoc);
