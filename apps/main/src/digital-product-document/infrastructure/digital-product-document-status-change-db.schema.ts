import type { DigitalProductDocumentStatusType } from "../domain/digital-product-document-status";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { DigitalProductDocumentStatus } from "../domain/digital-product-document-status";

@Schema({ id: false })
export class DigitalProductDocumentStatusChangeDoc {
  @Prop({ enum: Object.values(DigitalProductDocumentStatus), type: String, required: false })
  previousStatus: DigitalProductDocumentStatusType | null;

  @Prop({ enum: Object.values(DigitalProductDocumentStatus), type: String, required: false })
  currentStatus: DigitalProductDocumentStatusType | null;
}

export const DigitalProductDocumentStatusChangeDbSchema = SchemaFactory.createForClass(
  DigitalProductDocumentStatusChangeDoc,
);
