import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { LanguageTextDoc, LanguageTextSchema } from "./common/language.text.schema";

export class ConceptDescriptionDoc {
  @Prop({ required: true })
  id: string;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop()
  category?: string;

  @Prop()
  idShort?: string;

  @Prop({ type: [LanguageTextSchema], default: [] })
  displayName?: LanguageTextDoc[];

  @Prop({ type: [LanguageTextSchema], default: [] })
  description?: LanguageTextDoc[];

  @Prop({ type: AdministrativeInformationSchema })
  administration?: AdministrativeInformationDoc;

  @Prop({ type: [EmbeddedDataSpecificationSchema], default: [] })
  embeddedDataSpecifications?: EmbeddedDataSpecificationDoc[];

  @Prop({ type: ReferenceSchema })
  isCaseOf?: ReferenceDoc;
}

export const ConceptDescriptionSchema = SchemaFactory.createForClass(ConceptDescriptionDoc);
