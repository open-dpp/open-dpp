import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const UniqueProductIdentifierSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;

export type UniqueProductIdentifierSchemaVersion_TYPE
  = (typeof UniqueProductIdentifierSchemaVersion)[keyof typeof UniqueProductIdentifierSchemaVersion];

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

  @Prop({
    default: UniqueProductIdentifierSchemaVersion.v1_0_0,
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
