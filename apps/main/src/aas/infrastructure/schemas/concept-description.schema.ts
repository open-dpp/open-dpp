import type { EmbeddedDataSpecificationDb, ExtensionDb, ReferenceDb } from "./db-types";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import {
  AdministrativeInformationDoc,
  AdministrativeInformationSchema,
} from "./administration.information.schema";
import { LanguageTextDoc, LanguageTextSchema } from "./language.text.schema";

export const ConceptDescriptionDocSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;
type ConceptDescriptionDocSchemaVersionType = (typeof ConceptDescriptionDocSchemaVersion)[keyof typeof ConceptDescriptionDocSchemaVersion];

@Schema({ collection: "concept_descriptions" })
export class ConceptDescriptionDoc extends Document<string> {
  @Prop({ type: String })
  declare _id: string;

  @Prop({
    default: ConceptDescriptionDocSchemaVersion.v1_0_0,
    enum: Object.values(ConceptDescriptionDocSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: ConceptDescriptionDocSchemaVersionType;

  @Prop({ type: [MongooseSchema.Types.Mixed], required: true })
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

  @Prop({ type: [MongooseSchema.Types.Mixed], required: true })
  embeddedDataSpecifications: EmbeddedDataSpecificationDb[];

  @Prop({ type: [MongooseSchema.Types.Mixed], required: true })
  isCaseOf: ReferenceDb[];
}

export const ConceptDescriptionSchema = SchemaFactory.createForClass(ConceptDescriptionDoc);
