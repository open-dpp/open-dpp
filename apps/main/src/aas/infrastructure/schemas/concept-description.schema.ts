import { Prop, SchemaFactory } from "@nestjs/mongoose";
import {
  AdministrativeInformationDoc,
  AdministrativeInformationSchema,
} from "./common/administration.information.schema";
import { LanguageTextDoc, LanguageTextSchema } from "./common/language.text.schema";
import { ReferenceDoc, ReferenceSchema } from "./common/reference.schema";
import { EmbeddedDataSpecificationDoc, EmbeddedDataSpecificationSchema } from "./embedded-data-specification.schema";
import { ExtensionDoc, ExtensionSchema } from "./extension.schema";

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
