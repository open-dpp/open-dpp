import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from "mongoose";
import { ModellingKind } from "../../../domain/common/has-kind";
import {
  AdministrativeInformationDoc,
  AdministrativeInformationSchema,
} from "../common/administration.information.schema";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc, SubmodelBaseSchema } from "./submodel-base.schema";
import { registerSubmodelBaseSchemas } from "./submodel-discriminators";

export enum SubmodelDocSchemaVersion {
  v1_0_0 = "1.0.0",
}

@Schema({ _id: false })
export class SubmodelDoc extends SubmodelBaseDoc {
  @Prop({
    default: SubmodelDocSchemaVersion.v1_0_0,
    enum: Object.values(SubmodelDocSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: SubmodelDocSchemaVersion;

  @Prop({ required: true })
  _id: string;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop({ type: AdministrativeInformationSchema })
  administration: AdministrativeInformationDoc;

  @Prop({ enum: Object.values(ModellingKind), type: String })
  kind?: ModellingKind;

  @Prop({ type: [SubmodelBaseSchema], default: [] })
  submodelElements?: SubmodelBaseDoc[];
}

export const SubmodelSchema = SchemaFactory.createForClass(SubmodelDoc);
const submodelElementsPath
  = SubmodelSchema.path("submodelElements") as MongooseSchema.Types.DocumentArray;
registerSubmodelBaseSchemas(submodelElementsPath);
