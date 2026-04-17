import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { PresentationReferenceType } from "@open-dpp/dto";
import { Document } from "mongoose";

export const PresentationConfigurationDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type PresentationConfigurationDocVersionType =
  (typeof PresentationConfigurationDocVersion)[keyof typeof PresentationConfigurationDocVersion];

@Schema({ collection: "presentation_configurations" })
export class PresentationConfigurationDoc extends Document<string> {
  @Prop({
    default: PresentationConfigurationDocVersion.v1_0_0,
    enum: Object.values(PresentationConfigurationDocVersion),
    type: String,
  })
  _schemaVersion: PresentationConfigurationDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: String, required: true })
  referenceId: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(PresentationReferenceType),
  })
  referenceType: (typeof PresentationReferenceType)[keyof typeof PresentationReferenceType];

  @Prop({ type: Object, required: true, default: {} })
  elementDesign: Record<string, string>;

  @Prop({ type: Object, required: true, default: {} })
  defaultComponents: Record<string, string>;

  @Prop({ required: true, immutable: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const PresentationConfigurationSchema = SchemaFactory.createForClass(
  PresentationConfigurationDoc,
);

PresentationConfigurationSchema.index({ referenceType: 1, referenceId: 1 }, { unique: true });
PresentationConfigurationSchema.index({ organizationId: 1, createdAt: -1, _id: -1 });
