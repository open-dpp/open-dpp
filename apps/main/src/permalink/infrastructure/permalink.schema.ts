import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const PermalinkDocVersion = {
  v1_0_0: "1.0.0",
} as const;

type PermalinkDocVersionType = (typeof PermalinkDocVersion)[keyof typeof PermalinkDocVersion];

@Schema({ collection: "permalinks" })
export class PermalinkDoc extends Document<string> {
  @Prop({
    default: PermalinkDocVersion.v1_0_0,
    enum: Object.values(PermalinkDocVersion),
    type: String,
  })
  _schemaVersion: PermalinkDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: false, default: null })
  slug: string | null;

  @Prop({ type: String, required: true })
  presentationConfigurationId: string;

  @Prop({ required: true, immutable: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const PermalinkSchema = SchemaFactory.createForClass(PermalinkDoc);

PermalinkSchema.index({ presentationConfigurationId: 1 }, { unique: true });
// Partial unique index: enforces uniqueness only on documents whose `slug` is
// a string. Rows with `slug: null` are excluded, so multiple permalinks may
// exist without a slug set — uniqueness applies once a slug is assigned.
PermalinkSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { slug: { $type: "string" } },
  },
);
