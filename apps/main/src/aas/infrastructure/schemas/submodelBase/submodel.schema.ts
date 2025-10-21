import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ModellingKind } from "../../../domain/common/has-kind";
import { ReferenceTypes } from "../../../domain/common/reference";
import { LanguageTextDoc, LanguageTextSchema } from "../common/language.text.schema";
import { QualifierSchema } from "../common/qualifier.schema";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";

@Schema({ _id: false })
export class SubmodelBaseDoc {
  @Prop()
  category?: string;

  @Prop()
  idShort?: string;

  @Prop({ type: [LanguageTextSchema], default: [] })
  displayName?: LanguageTextDoc[];

  @Prop({ type: [LanguageTextSchema], default: [] })
  description?: LanguageTextDoc[];

  @Prop({ type: ReferenceSchema })
  semanticId?: ReferenceDoc;

  @Prop({ type: [ReferenceSchema], default: [] })
  supplementalSemanticIds?: ReferenceDoc[];

  @Prop({ qualifiers: [QualifierSchema], default: [] })
  qualifiers?: QualifierDoc[];

  @Prop({ type: [EmbeddedDataSpecificationSchema], default: [] })
  embeddedDataSpecifications?: EmbeddedDataSpecificationDoc[];
}

export const SubmodelBaseSchema = SchemaFactory.createForClass(SubmodelBaseDoc);

@Schema({ _id: false })
export class SubmodelDoc extends SubmodelBaseDoc {
  @Prop({ required: true })
  id: string;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop({ required: true, enum: ReferenceTypes })
  type: ReferenceTypes;

  @Prop({ type: AdministrativeInformationSchema })
  administration?: AdministrativeInformationDoc;

  @Prop({ enum: ModellingKind })
  kind?: ModellingKind;

  @Prop({ type: [SubmodelBaseSchema], default: [] })
  submodelElements?: SubmodelBaseDoc[];
}

export const SubmodelSchema = SchemaFactory.createForClass(SubmodelDoc);
