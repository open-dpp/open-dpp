import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { z } from "zod";
import { ModellingKind } from "../../../domain/common/has-kind";
import {
  EmbeddedDataSpecificationJsonSchema,
  ExtensionJsonSchema,
  QualifierJsonSchema,
  ReferenceJsonSchema,
  SubmodelBaseUnionSchema,
} from "../../../domain/zod-schemas";
import {
  AdministrativeInformationDoc,
  AdministrativeInformationSchema,
} from "../common/administration.information.schema";
import { LanguageTextDoc, LanguageTextSchema } from "../common/language.text.schema";

export enum SubmodelDocSchemaVersion {
  v1_0_0 = "1.0.0",
}

@Schema({ _id: false })
export class SubmodelDoc extends Document {
  @Prop({
    default: SubmodelDocSchemaVersion.v1_0_0,
    enum: Object.values(SubmodelDocSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: SubmodelDocSchemaVersion;

  @Prop({ required: true })
  _id: string;

  // -----
  @Prop({ type: String, cast: false })
  category?: string;

  @Prop({ type: String, cast: false })
  idShort?: string;

  @Prop({ type: [LanguageTextSchema], default: [] })
  displayName?: LanguageTextDoc[];

  @Prop({ type: [LanguageTextSchema], default: [] })
  description?: LanguageTextDoc[];

  @Prop({ type: MongooseSchema.Types.Mixed, validate: (value: any) => ReferenceJsonSchema.nullish().parse(value) })
  semanticId?: z.infer<typeof ReferenceJsonSchema>;

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => z.array(ReferenceJsonSchema).parse(value) })
  supplementalSemanticIds: z.infer<typeof ReferenceJsonSchema>[];

  @Prop({ qualifiers: [MongooseSchema.Types.Mixed], validate: (value: any) => z.array(QualifierJsonSchema).parse(value) })
  qualifiers: z.infer<typeof QualifierJsonSchema>[];

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => z.array(EmbeddedDataSpecificationJsonSchema).parse(value) })
  embeddedDataSpecifications: z.infer<typeof EmbeddedDataSpecificationJsonSchema>[];

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => z.array(ExtensionJsonSchema).parse(value) })
  extensions: z.infer<typeof ExtensionJsonSchema>[];

  @Prop({ type: AdministrativeInformationSchema })
  administration: AdministrativeInformationDoc;

  @Prop({ enum: Object.values(ModellingKind), type: String })
  kind?: ModellingKind;

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => SubmodelBaseUnionSchema.array().parse(value) })
  submodelElements: z.infer<typeof SubmodelBaseUnionSchema>[];
}

export const SubmodelSchema = SchemaFactory.createForClass(SubmodelDoc);
// const path = SubmodelSchema.path("submodelElements") as MongooseSchema.Types.DocumentArray;
// registerSubmodelSchema(path);
