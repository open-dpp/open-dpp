import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const BrandingDocVersion = {
  v1_0_0: "1.0.0",
  v1_1_0: "1.1.0",
} as const;
type BrandingDocVersionType = (typeof BrandingDocVersion)[keyof typeof BrandingDocVersion];

@Schema({ collection: "branding" })
export class BrandingDoc extends Document<string> {
  @Prop({
    default: BrandingDocVersion.v1_1_0,
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

  // Org-level white-label base URL for public permalinks. Per-permalink
  // overrides take precedence; otherwise this is used; otherwise OPEN_DPP_URL.
  // Stored as a canonical origin URL (validated/transformed by
  // PermalinkBaseUrlSchema in the DTO layer).
  @Prop({ type: String, required: false, default: null })
  permalinkBaseUrl: string | null;
}

export const BrandingSchema = SchemaFactory.createForClass(BrandingDoc);
BrandingSchema.index({ organizationId: 1 });
