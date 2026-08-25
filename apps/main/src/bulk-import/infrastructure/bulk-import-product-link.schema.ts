import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "bulk_import_product_links" })
export class BulkImportProductLinkDoc extends Document<string> {
  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: String, required: true })
  templateId: string;

  @Prop({ type: String, required: true })
  externalId: string;

  @Prop({ type: String, required: true })
  passportId: string;

  @Prop({ required: true, immutable: true })
  createdAt: Date;
}

export const BulkImportProductLinkSchema = SchemaFactory.createForClass(BulkImportProductLinkDoc);
BulkImportProductLinkSchema.index(
  { organizationId: 1, templateId: 1, externalId: 1 },
  { unique: true },
);
