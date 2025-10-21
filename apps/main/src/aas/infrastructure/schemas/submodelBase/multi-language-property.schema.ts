import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { LanguageTextDoc, LanguageTextSchema } from "../common/language.text.schema";
import { ReferenceDoc } from "../common/reference.schema";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc } from "./submodel.schema";

@Schema({ _id: false })
export class MultiLanguagePropertyDoc extends SubmodelBaseDoc {
  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop({ type: [LanguageTextSchema], default: [] })
  value?: LanguageTextDoc[];

  @Prop({ type: ReferenceSchema })
  valueId: ReferenceDoc | null = null;
}

export const MultiLanguagePropertySchema = SchemaFactory.createForClass(MultiLanguagePropertyDoc);
