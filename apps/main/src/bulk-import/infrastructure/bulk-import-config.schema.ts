import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export const BulkImportConfigDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type BulkImportConfigDocVersionType =
  (typeof BulkImportConfigDocVersion)[keyof typeof BulkImportConfigDocVersion];

@Schema({ _id: false })
export class FieldMappingDoc {
  @Prop({ type: String, required: true })
  input: string;

  @Prop({ type: String, required: true })
  output: string;
}
const FieldMappingDocSchema = SchemaFactory.createForClass(FieldMappingDoc);

@Schema({ _id: false })
export class SubmodelMappingDoc {
  @Prop({ type: String, required: true })
  submodelIdShort: string;

  @Prop({ type: [FieldMappingDocSchema], required: true, default: [] })
  fieldMappings: FieldMappingDoc[];
}
const SubmodelMappingDocSchema = SchemaFactory.createForClass(SubmodelMappingDoc);

@Schema({ collection: "bulk_import_configs" })
export class BulkImportConfigDoc extends Document<string> {
  @Prop({
    default: BulkImportConfigDocVersion.v1_0_0,
    enum: Object.values(BulkImportConfigDocVersion),
    type: String,
  })
  _schemaVersion: BulkImportConfigDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: String, required: true })
  templateId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  idField: string;

  @Prop({ type: [SubmodelMappingDocSchema], required: true, default: [] })
  submodelMappings: SubmodelMappingDoc[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  inputSample: Record<string, unknown> | null;

  @Prop({ required: true, immutable: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const BulkImportConfigSchema = SchemaFactory.createForClass(BulkImportConfigDoc);
BulkImportConfigSchema.index({ organizationId: 1, templateId: 1 });
