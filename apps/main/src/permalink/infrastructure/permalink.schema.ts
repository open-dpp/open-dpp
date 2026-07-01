import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const PermalinkDocVersion = {
  v1_0_0: "1.0.0",
  v1_1_0: "1.1.0",
  v1_2_0: "1.2.0",
  v1_3_0: "1.3.0",
} as const;

type PermalinkDocVersionType = (typeof PermalinkDocVersion)[keyof typeof PermalinkDocVersion];

@Schema({ collection: "permalinks" })
export class PermalinkDoc extends Document<string> {
  @Prop({
    default: PermalinkDocVersion.v1_3_0,
    enum: Object.values(PermalinkDocVersion),
    type: String,
  })
  _schemaVersion: PermalinkDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: false, default: null })
  organizationId: string | null;

  @Prop({ type: Boolean, required: true, default: false })
  primary: boolean;

  @Prop({ type: String, required: false, default: null })
  slug: string | null;

  @Prop({ type: String, required: false, default: null })
  baseUrl: string | null;

  @Prop({ type: String, required: false, default: null })
  publishedUrl: string | null;

  @Prop({ type: String, required: false, default: "presentation" })
  kind: string;

  @Prop({ type: String, required: false, default: null })
  presentationConfigurationId: string | null;

  @Prop({ type: String, required: false, default: null })
  uniqueProductIdentifierId: string | null;

  @Prop({ type: Object, required: false, default: null })
  gs1DataAttributes: Record<string, string> | null;

  @Prop({ required: true, immutable: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const PermalinkSchema = SchemaFactory.createForClass(PermalinkDoc);

PermalinkSchema.index(
  { presentationConfigurationId: 1 },
  {
    unique: true,
    partialFilterExpression: { presentationConfigurationId: { $type: "string" } },
  },
);
PermalinkSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { slug: { $type: "string" } },
  },
);
PermalinkSchema.index(
  { uniqueProductIdentifierId: 1 },
  {
    unique: true,
    partialFilterExpression: { uniqueProductIdentifierId: { $type: "string" } },
  },
);
PermalinkSchema.index({ organizationId: 1, createdAt: -1, _id: -1 });
