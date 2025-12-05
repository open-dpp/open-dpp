import type { AssetInformationDb, EmbeddedDataSpecificationDb, ExtensionDb, ReferenceDb } from "./db-types";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { AssetInformationJsonSchema } from "../../domain/parsing/asset-information-json-schema";
import { ReferenceJsonSchema } from "../../domain/parsing/common/reference-json-schema";
import { EmbeddedDataSpecificationJsonSchema } from "../../domain/parsing/embedded-data-specification-json-schema";
import { ExtensionJsonSchema } from "../../domain/parsing/extension-json-schema";
import { AdministrativeInformationDoc, AdministrativeInformationSchema } from "./administration.information.schema";
import { LanguageTextDoc, LanguageTextSchema } from "./language.text.schema";

export const AssetAdministrationShellDocSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;
type AssetAdministrationShellDocSchemaVersionType = (typeof AssetAdministrationShellDocSchemaVersion)[keyof typeof AssetAdministrationShellDocSchemaVersion];
@Schema()
export class AssetAdministrationShellDoc extends Document {
  @Prop({ type: String })
  declare _id: string;

  @Prop({
    default: AssetAdministrationShellDocSchemaVersion.v1_0_0,
    enum: Object.values(AssetAdministrationShellDocSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: AssetAdministrationShellDocSchemaVersionType;

  @Prop({ type: MongooseSchema.Types.Mixed, validate: (value: any) => AssetInformationJsonSchema.parse(value), required: true })
  assetInformation: AssetInformationDb;

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => ExtensionJsonSchema.array().parse(value), required: true })
  extensions: ExtensionDb[];

  @Prop({ type: String, cast: false })
  category?: string;

  @Prop({ type: String, cast: false })
  idShort?: string;

  @Prop({ type: [LanguageTextSchema] })
  displayName: LanguageTextDoc[];

  @Prop({ type: [LanguageTextSchema] })
  description: LanguageTextDoc[];

  @Prop({ type: AdministrativeInformationSchema })
  administration?: AdministrativeInformationDoc;

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => EmbeddedDataSpecificationJsonSchema.array().parse(value) })
  embeddedDataSpecifications: EmbeddedDataSpecificationDb[];

  @Prop({ type: MongooseSchema.Types.Mixed, validate: (value: any) => ReferenceJsonSchema.nullish().parse(value) })
  derivedFrom?: ReferenceDb;

  @Prop({ type: [MongooseSchema.Types.Mixed], validate: (value: any) => ReferenceJsonSchema.array().parse(value) })
  submodels: ReferenceDb[];
}

export const AssetAdministrationShellSchema = SchemaFactory.createForClass(AssetAdministrationShellDoc);
