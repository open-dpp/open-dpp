import type { AssetInformationDb, EmbeddedDataSpecificationDb, ExtensionDb, ReferenceDb } from "./db-types";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { AdministrativeInformationDoc, AdministrativeInformationSchema } from "./administration.information.schema";
import { LanguageTextDoc, LanguageTextSchema } from "./language.text.schema";

export const AssetAdministrationShellDocSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;
type AssetAdministrationShellDocSchemaVersionType = (typeof AssetAdministrationShellDocSchemaVersion)[keyof typeof AssetAdministrationShellDocSchemaVersion];
@Schema()
export class AssetAdministrationShellDoc extends Document<string> {
  @Prop({ type: String })
  declare _id: string;

  @Prop({
    default: AssetAdministrationShellDocSchemaVersion.v1_0_0,
    enum: Object.values(AssetAdministrationShellDocSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: AssetAdministrationShellDocSchemaVersionType;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  assetInformation: AssetInformationDb;

  @Prop({ type: [MongooseSchema.Types.Mixed], required: true })
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

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  embeddedDataSpecifications: EmbeddedDataSpecificationDb[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  derivedFrom?: ReferenceDb;

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  submodels: ReferenceDb[];
}

export const AssetAdministrationShellSchema = SchemaFactory.createForClass(AssetAdministrationShellDoc);
