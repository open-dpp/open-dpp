import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc } from "./submodel.schema";

export class ReferenceElementDoc extends SubmodelBaseDoc {
  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop({ type: ReferenceSchema })
  value?: ReferenceDoc;
}

export const ReferenceElementSchema = SchemaFactory.createForClass(ReferenceElementDoc);
