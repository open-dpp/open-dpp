import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  createCommonIndexesForPassportDoc,
  PassportDoc,
} from '../../product-passport-data/infrastructure/product-passport-data.schema';

export enum ItemDocSchemaVersion {
  v1_0_0 = '1.0.0',
  v1_0_1 = '1.0.1',
  v1_0_2 = '1.0.2',
}

@Schema({ collection: 'items', timestamps: true })
export class ItemDoc extends PassportDoc {
  @Prop({
    default: ItemDocSchemaVersion.v1_0_2,
    enum: ItemDocSchemaVersion,
  }) // Track schema version
  _schemaVersion: ItemDocSchemaVersion;
  @Prop({ type: String, required: true })
  modelId: string;
}
export const ItemSchema = SchemaFactory.createForClass(ItemDoc);

ItemSchema.index({ modelId: 1 });
createCommonIndexesForPassportDoc(ItemSchema);
