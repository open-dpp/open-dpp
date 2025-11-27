import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { LanguageTextDoc, LanguageTextSchema } from "../common/language.text.schema";
import { QualifierDoc, QualifierSchema } from "../common/qualifier.schema";
import { ReferenceDoc, ReferenceSchema } from "../common/reference.schema";
import { EmbeddedDataSpecificationDoc, EmbeddedDataSpecificationSchema } from "../embedded-data-specification.schema";

@Schema({ _id: false, discriminatorKey: "modelType", strict: true })
export class SubmodelBaseDoc extends Document {
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
// const submodelElementsPath
//   = SubmodelSchema.path("submodelElements") as MongooseSchema.Types.DocumentArray;
