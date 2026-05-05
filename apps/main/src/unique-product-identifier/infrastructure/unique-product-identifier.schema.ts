import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import {
  ExternalIdentifierType,
  type ExternalIdentifierTypeValue,
} from "../presentation/dto/unique-product-identifier-dto.schema";

export const UniqueProductIdentifierSchemaVersion = {
  v1_0_0: "1.0.0",
  v1_1_0: "1.1.0",
} as const;

export type UniqueProductIdentifierSchemaVersion_TYPE =
  (typeof UniqueProductIdentifierSchemaVersion)[keyof typeof UniqueProductIdentifierSchemaVersion];

@Schema({
  collection: "unique_product_identifiers",
  timestamps: true,
})
export class UniqueProductIdentifierDoc extends Document {
  @Prop({ required: true })
  // @ts-expect-error uses mongo id
  _id: string;

  @Prop({ required: true })
  referenceId: string;

  // Registry / scheme discriminator. Optional on existing rows (default
  // applied at read time) so the field can be added without a one-shot data
  // migration; new rows always carry it explicitly. See
  // ExternalIdentifierType for the full set.
  @Prop({
    default: ExternalIdentifierType.OPEN_DPP_UUID,
    enum: Object.values(ExternalIdentifierType),
    type: String,
  })
  type?: ExternalIdentifierTypeValue;

  @Prop({
    default: UniqueProductIdentifierSchemaVersion.v1_1_0,
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
