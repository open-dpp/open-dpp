import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BulkImportRunItemStatusDto, type BulkImportRunItemStatusDtoType } from "@open-dpp/dto";
import { Document, Schema as MongooseSchema } from "mongoose";

export const BulkImportRunItemDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type BulkImportRunItemDocVersionType =
  (typeof BulkImportRunItemDocVersion)[keyof typeof BulkImportRunItemDocVersion];

@Schema({ collection: "bulk_import_run_items" })
export class BulkImportRunItemDoc extends Document<string> {
  @Prop({
    default: BulkImportRunItemDocVersion.v1_0_0,
    enum: Object.values(BulkImportRunItemDocVersion),
    type: String,
  })
  _schemaVersion: BulkImportRunItemDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: true })
  runId: string;

  @Prop({ type: Number, required: true })
  rowIndex: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  inputData: Record<string, unknown>;

  @Prop({ type: String, enum: Object.values(BulkImportRunItemStatusDto), required: true })
  status: BulkImportRunItemStatusDtoType;

  @Prop({ type: String, default: null })
  passportId: string | null;

  @Prop({ type: String, default: null })
  error: string | null;
}

export const BulkImportRunItemSchema = SchemaFactory.createForClass(BulkImportRunItemDoc);
BulkImportRunItemSchema.index({ runId: 1, rowIndex: 1 });
