import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { PermalinkKind } from "@open-dpp/dto";
import { Document } from "mongoose";

export const PermalinkDocVersion = {
  v1_0_0: "1.0.0",
  v1_1_0: "1.1.0",
  v1_2_0: "1.2.0",
  v1_3_0: "1.3.0",
  v1_4_0: "1.4.0",
} as const;

type PermalinkDocVersionType = (typeof PermalinkDocVersion)[keyof typeof PermalinkDocVersion];

@Schema({ collection: "permalinks" })
export class PermalinkDoc extends Document<string> {
  @Prop({
    default: PermalinkDocVersion.v1_4_0,
    enum: Object.values(PermalinkDocVersion),
    type: String,
  })
  _schemaVersion: PermalinkDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  /**
   * Direct passport reference (v1.4.0+). Legacy docs carry null and are
   * resolved on read via the config/UPI join in `PermalinkRepository`.
   */
  @Prop({ type: String, required: false, default: null })
  passportId: string | null;

  @Prop({ type: String, required: false, default: null })
  organizationId: string | null;

  @Prop({ type: String, required: false, default: null })
  slug: string | null;

  @Prop({ type: String, required: false, default: null })
  baseUrl: string | null;

  @Prop({ type: String, required: false, default: null })
  publishedUrl: string | null;

  @Prop({ type: String, required: false, default: PermalinkKind.OPEN_DPP })
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
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { slug: { $type: "string" } },
  },
);

/**
 * One gs1-link per UPI: the GS1 resolver maps a gtin to exactly one permalink,
 * and the Digital Link URL is gtin-keyed, so two gs1-links on one UPI would
 * share a public URL and make the config-override choice ambiguous. Open-dpp
 * permalinks have per-permalink URLs (`/p/{slug ?? id}`) and may reference a
 * UPI without limit, so the filter is kind-scoped. The `"gs1-link"` wire value
 * predates the open-dpp rename and is stable — no legacy-value handling needed.
 */
PermalinkSchema.index(
  { uniqueProductIdentifierId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      uniqueProductIdentifierId: { $type: "string" },
      kind: PermalinkKind.GS1_LINK,
    },
  },
);
PermalinkSchema.index({ organizationId: 1, createdAt: -1, _id: -1 });
PermalinkSchema.index({ passportId: 1, createdAt: -1, _id: -1 });
