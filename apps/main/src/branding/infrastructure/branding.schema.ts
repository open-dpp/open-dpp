import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const BrandingDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type BrandingDocVersionType = (typeof BrandingDocVersion)[keyof typeof BrandingDocVersion];

@Schema({ collection: "branding" })
export class BrandingDoc extends Document<string> {
  @Prop({
    default: BrandingDocVersion.v1_0_0,
    enum: Object.values(BrandingDocVersion),
    type: String,
  })
  _schemaVersion: BrandingDocVersionType;

  @Prop({ type: String, required: true, unique: true })
  organizationId: string;

  @Prop({ type: String })
  logo: string;

  @Prop({ type: String })
  primaryColor: string;
}

export const BrandingSchema = SchemaFactory.createForClass(BrandingDoc);
BrandingSchema.index({ organizationId: 1 });
