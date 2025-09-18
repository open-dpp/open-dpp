import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UniqueProductIdentifierSchemaVersion {
  v1_0_0 = '1.0.0',
}

@Schema({
  collection: 'unique_product_identifiers',
  timestamps: true,
})
export class UniqueProductIdentifierDoc extends Document {
  @Prop({ required: true })
  // @ts-ignore
  _id: string;

  @Prop({ required: true })
  referenceId: string;

  @Prop({
    default: UniqueProductIdentifierSchemaVersion.v1_0_0,
    enum: UniqueProductIdentifierSchemaVersion,
  }) // Track schema version
  _schemaVersion: UniqueProductIdentifierSchemaVersion;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}
export const UniqueProductIdentifierSchema = SchemaFactory.createForClass(
  UniqueProductIdentifierDoc,
);

UniqueProductIdentifierSchema.index({ referenceId: 1 });
