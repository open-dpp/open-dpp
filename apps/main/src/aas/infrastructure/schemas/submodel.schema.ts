import type { ModellingKindType } from "../../domain/common/has-kind";
import type {
  EmbeddedDataSpecificationDb,
  ExtensionDb,
  QualifierDb,
  ReferenceDb,
  SubmodelBaseUnionDb,
} from "./db-types";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { z } from "zod";
import { ModellingKind } from "../../domain/common/has-kind";
import { QualifierJsonSchema } from "../../domain/parsing/common/qualifier-json-schema";
import { ReferenceJsonSchema } from "../../domain/parsing/common/reference-json-schema";
import { EmbeddedDataSpecificationJsonSchema } from "../../domain/parsing/embedded-data-specification-json-schema";
import { ExtensionJsonSchema } from "../../domain/parsing/extension-json-schema";
import { SubmodelBaseUnionSchema } from "../../domain/parsing/submodel-base/submodel-base-union-schema";
import { AdministrativeInformationDoc, AdministrativeInformationSchema } from "./administration.information.schema";
import { LanguageTextDoc, LanguageTextSchema } from "./language.text.schema";

export const SubmodelDocSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;
type SubmodelDocSchemaVersionType = (typeof SubmodelDocSchemaVersion)[keyof typeof SubmodelDocSchemaVersion];

@Schema({ collection: "submodels" })
export class SubmodelDoc extends Document {
  @Prop({ type: String })
  declare _id: string;

  @Prop({
    default: SubmodelDocSchemaVersion.v1_0_0,
    enum: Object.values(SubmodelDocSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: SubmodelDocSchemaVersionType;

  @Prop({ type: String, cast: false })
  category?: string;

  @Prop({ type: String, cast: false })
  idShort?: string;

  @Prop({ type: [LanguageTextSchema], default: [] })
  displayName?: LanguageTextDoc[];

  @Prop({ type: [LanguageTextSchema], default: [] })
  description?: LanguageTextDoc[];

  @Prop({ type: MongooseSchema.Types.Mixed, validate: (value: any) => ReferenceJsonSchema.nullish().parse(value) })
  semanticId?: ReferenceDb;

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => z.array(ReferenceJsonSchema).parse(value) })
  supplementalSemanticIds: ReferenceDb[];

  @Prop({ qualifiers: [MongooseSchema.Types.Mixed], validate: (value: any) => z.array(QualifierJsonSchema).parse(value) })
  qualifiers: QualifierDb[];

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => z.array(EmbeddedDataSpecificationJsonSchema).parse(value) })
  embeddedDataSpecifications: EmbeddedDataSpecificationDb[];

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => z.array(ExtensionJsonSchema).parse(value) })
  extensions: ExtensionDb[];

  @Prop({ type: AdministrativeInformationSchema })
  administration: AdministrativeInformationDoc;

  @Prop({ enum: Object.values(ModellingKind), type: String })
  kind?: ModellingKindType;

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => SubmodelBaseUnionSchema.array().parse(value) })
  submodelElements: SubmodelBaseUnionDb[];
}

export const SubmodelSchema = SchemaFactory.createForClass(SubmodelDoc);
