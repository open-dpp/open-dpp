import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  createCommonIndexesForTemplate,
  TemplateBaseDoc,
} from '../../data-modelling/infrastructure/template-base.schema';

export enum TemplateDocSchemaVersion {
  v1_0_0 = '1.0.0',
  v1_0_1 = '1.0.1',
  v1_0_2 = '1.0.2',
  v1_0_3 = '1.0.3',
}

@Schema({ collection: 'product_data_models' })
export class TemplateDoc extends TemplateBaseDoc {
  @Prop({
    default: TemplateDocSchemaVersion.v1_0_3,
    enum: TemplateDocSchemaVersion,
  }) // Track schema version
  _schemaVersion: TemplateDocSchemaVersion;

  @Prop({
    required: false,
    default: null,
  })
  marketplaceResourceId: string;
}

export const TemplateSchema = SchemaFactory.createForClass(TemplateDoc);

createCommonIndexesForTemplate(TemplateSchema);
TemplateSchema.index({ marketplaceResourceId: 1 });
