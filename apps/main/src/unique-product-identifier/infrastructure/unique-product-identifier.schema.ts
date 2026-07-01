import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import {
  ExternalIdentifierType,
  type ExternalIdentifierTypeValue,
} from "../presentation/dto/unique-product-identifier-dto.schema";

export const UniqueProductIdentifierSchemaVersion = {
  v1_0_0: "1.0.0",
  v1_1_0: "1.1.0",
  v1_2_0: "1.2.0",
  v1_3_0: "1.3.0",
} as const;

export type UniqueProductIdentifierSchemaVersion_TYPE =
  (typeof UniqueProductIdentifierSchemaVersion)[keyof typeof UniqueProductIdentifierSchemaVersion];

/**
 * The MongoDB collection name for UPI documents. Exported so other repositories
 * (e.g. the permalink passport-scoped union query) can `$lookup` against it
 * without re-declaring the literal or taking a Mongoose-model DI dependency.
 */
export const UNIQUE_PRODUCT_IDENTIFIER_COLLECTION = "unique_product_identifiers";

@Schema({
  collection: UNIQUE_PRODUCT_IDENTIFIER_COLLECTION,
  timestamps: true,
})
export class UniqueProductIdentifierDoc extends Document {
  @Prop({ required: true })
  // @ts-expect-error uses mongo id
  _id: string;

  @Prop({ required: true })
  referenceId: string;

  @Prop({ type: String, required: false, default: null })
  organizationId?: string | null;

  @Prop({
    default: ExternalIdentifierType.OPEN_DPP_UUID,
    enum: Object.values(ExternalIdentifierType),
    type: String,
  })
  type?: ExternalIdentifierTypeValue;

  /**
   * GS1 identity: GTIN normalized to GTIN-14. Only populated on `type = GS1` rows;
   * null otherwise. Uniqueness is enforced by a partial compound index (see below).
   */
  @Prop({ type: String, required: false, default: null })
  gtin?: string | null;

  /**
   * GS1 batch / lot (AI `10`), CSET-82, ≤ 20 chars. Part of the assembled unique
   * key on `type = GS1` rows; null when absent.
   */
  @Prop({ type: String, required: false, default: null })
  batch?: string | null;

  /**
   * GS1 serial (AI `21`), CSET-82, ≤ 20 chars. Part of the assembled unique key on
   * `type = GS1` rows; null when absent.
   */
  @Prop({ type: String, required: false, default: null })
  serial?: string | null;

  @Prop({
    default: UniqueProductIdentifierSchemaVersion.v1_3_0,
    enum: Object.values(UniqueProductIdentifierSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: UniqueProductIdentifierSchemaVersion_TYPE;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}
export const UniqueProductIdentifierSchema = SchemaFactory.createForClass(
  UniqueProductIdentifierDoc,
);

UniqueProductIdentifierSchema.index({ referenceId: 1 });
UniqueProductIdentifierSchema.index({ type: 1 });
UniqueProductIdentifierSchema.index({ organizationId: 1, createdAt: -1, _id: -1 });
// Global uniqueness of the FULL assembled GS1 key (gtin, batch, serial). The
// partial filter scopes the constraint to GS1 rows (only those carry a string
// gtin), so OPEN_DPP_UUID rows (gtin = null) are never affected. Because batch
// and serial are stored as null when absent, a bare GTIN keys as
// (gtin, null, null) — still one passport per bare GTIN — while serialized units
// (same gtin, distinct serials) key distinctly and so become distinct passports.
UniqueProductIdentifierSchema.index(
  { gtin: 1, batch: 1, serial: 1 },
  {
    unique: true,
    partialFilterExpression: { gtin: { $type: "string" } },
  },
);
