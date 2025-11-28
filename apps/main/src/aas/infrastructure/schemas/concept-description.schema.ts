import type { EmbeddedDataSpecificationDb, ExtensionDb, ReferenceDb } from "./db-types";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { ReferenceJsonSchema } from "../../domain/parsing/common/reference-json-schema";
import { EmbeddedDataSpecificationJsonSchema } from "../../domain/parsing/embedded-data-specification-json-schema";
import { ExtensionJsonSchema } from "../../domain/parsing/extension-json-schema";
import {
  AdministrativeInformationDoc,
  AdministrativeInformationSchema,
} from "./administration.information.schema";
import { LanguageTextDoc, LanguageTextSchema } from "./language.text.schema";

export const ConceptDescriptionDocSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;
type ConceptDescriptionDocSchemaVersionType = (typeof ConceptDescriptionDocSchemaVersion)[keyof typeof ConceptDescriptionDocSchemaVersion];

@Schema()
export class ConceptDescriptionDoc extends Document {
  @Prop({ type: String })
  declare _id: string;

  @Prop({
    default: ConceptDescriptionDocSchemaVersion.v1_0_0,
    enum: Object.values(ConceptDescriptionDocSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: ConceptDescriptionDocSchemaVersionType;

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => ExtensionJsonSchema.array().parse(value), required: true })
  extensions: ExtensionDb[];

  @Prop({ type: String, cast: false })
  category?: string;

  @Prop({ type: String, cast: false })
  idShort?: string;

  @Prop({ type: [LanguageTextSchema], required: true })
  displayName: LanguageTextDoc[];

  @Prop({ type: [LanguageTextSchema], required: true })
  description: LanguageTextDoc[];

  @Prop({ type: AdministrativeInformationSchema })
  administration?: AdministrativeInformationDoc;

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => EmbeddedDataSpecificationJsonSchema.array().parse(value), required: true })
  embeddedDataSpecifications: EmbeddedDataSpecificationDb[];

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => ReferenceJsonSchema.array().parse(value), required: true })
  isCaseOf: ReferenceDb[];
}

export const ConceptDescriptionSchema = SchemaFactory.createForClass(ConceptDescriptionDoc);
