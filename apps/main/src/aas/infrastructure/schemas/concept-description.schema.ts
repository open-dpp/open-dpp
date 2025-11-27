import type { EmbeddedDataSpecificationDb, ExtensionDb, ReferenceDb } from "./db-types";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from "mongoose";
import {
  EmbeddedDataSpecificationJsonSchema,
  ExtensionJsonSchema,

} from "../../domain/parsing/aas-json-schemas";
import { ReferenceJsonSchema } from "../../domain/parsing/reference-json-schema";
import {
  AdministrativeInformationDoc,
  AdministrativeInformationSchema,
} from "./administration.information.schema";
import { LanguageTextDoc, LanguageTextSchema } from "./language.text.schema";

export class ConceptDescriptionDoc {
  @Prop({ required: true })
  id: string;

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

  @Prop({ type: MongooseSchema.Types.Mixed, validate: (value: any) => ReferenceJsonSchema.nullish().parse(value), required: false })
  isCaseOf?: ReferenceDb;
}

export const ConceptDescriptionSchema = SchemaFactory.createForClass(ConceptDescriptionDoc);
