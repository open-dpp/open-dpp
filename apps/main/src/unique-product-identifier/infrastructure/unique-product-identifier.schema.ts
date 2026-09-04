import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { UniqueProductIdentifierType, type UniqueProductIdentifierTypeValue } from "@open-dpp/dto";

export const UniqueProductIdentifierSchemaVersion = {
  v1_0_0: "1.0.0",
  v1_1_0: "1.1.0",
  v1_2_0: "1.2.0",
  v1_3_0: "1.3.0",
} as const;

export type UniqueProductIdentifierSchemaVersion_TYPE =
  (typeof UniqueProductIdentifierSchemaVersion)[keyof typeof UniqueProductIdentifierSchemaVersion];

export const UNIQUE_PRODUCT_IDENTIFIER_COLLECTION = "unique_product_identifiers";

@Schema({ _id: false })
export class IdentifierPart {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  value: string;
}

export const IdentifierPartSchema = SchemaFactory.createForClass(IdentifierPart);

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
    default: UniqueProductIdentifierType.OPEN_DPP_UUID,
    enum: Object.values(UniqueProductIdentifierType),
    type: String,
  })
  type?: UniqueProductIdentifierTypeValue;

  // Canonical exact-match lookup value (Digital-Link path for GS1, the uuid
  // otherwise). Optional in the type because legacy pre-parts docs lack it;
  // every save() writes it.
  @Prop({ type: String, required: false })
  value?: string;

  // Component breakdown for composite identifiers (e.g. gtin/batch/serial for
  // GS1); absent for single-value identifiers such as OPEN_DPP_UUID.
  @Prop({ type: [IdentifierPartSchema], default: undefined })
  parts?: IdentifierPart[];

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
// Global (not org-scoped) uniqueness: the public GS1 resolver looks up a key
// with no organization context, so one canonical value must map to exactly one
// passport. Partial so legacy docs without `value` stay out of the index.
UniqueProductIdentifierSchema.index(
  { type: 1, value: 1 },
  {
    unique: true,
    partialFilterExpression: { value: { $type: "string" } },
  },
);
