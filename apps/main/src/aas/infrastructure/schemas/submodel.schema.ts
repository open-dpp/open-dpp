import type { ModellingKindType } from "@open-dpp/dto";
import type {
  EmbeddedDataSpecificationDb,
  ExtensionDb,
  QualifierDb,
  ReferenceDb,
  SubmodelBaseUnionDb,
} from "./db-types";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ModellingKind } from "@open-dpp/dto";
import { Document, Schema as MongooseSchema } from "mongoose";
import { AdministrativeInformationDoc, AdministrativeInformationSchema } from "./administration.information.schema";
import { LanguageTextDoc, LanguageTextSchema } from "./language.text.schema";

export const SubmodelDocSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;
type SubmodelDocSchemaVersionType = (typeof SubmodelDocSchemaVersion)[keyof typeof SubmodelDocSchemaVersion];

@Schema({ collection: "submodels" })
export class SubmodelDoc extends Document<string> {
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

  @Prop({ type: MongooseSchema.Types.Mixed })
  semanticId?: ReferenceDb;

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  supplementalSemanticIds: ReferenceDb[];

  @Prop({ qualifiers: [MongooseSchema.Types.Mixed] })
  qualifiers: QualifierDb[];

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  embeddedDataSpecifications: EmbeddedDataSpecificationDb[];

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  extensions: ExtensionDb[];

  @Prop({ type: AdministrativeInformationSchema })
  administration: AdministrativeInformationDoc;

  @Prop({ enum: Object.values(ModellingKind), type: String })
  kind?: ModellingKindType;

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  submodelElements: SubmodelBaseUnionDb[];
}

export const SubmodelSchema = SchemaFactory.createForClass(SubmodelDoc);
