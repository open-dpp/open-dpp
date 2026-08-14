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

  @Prop({ type: String, required: false, default: null })
  gtin?: string | null;

  @Prop({ type: String, required: false, default: null })
  batch?: string | null;

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
UniqueProductIdentifierSchema.index(
  { gtin: 1, batch: 1, serial: 1 },
  {
    unique: true,
    partialFilterExpression: { gtin: { $type: "string" } },
  },
);
