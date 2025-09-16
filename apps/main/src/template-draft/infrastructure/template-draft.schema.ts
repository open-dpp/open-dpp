import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  createCommonIndexesForTemplate,
  TemplateBaseDoc,
} from '../../data-modelling/infrastructure/template-base.schema';

@Schema({ _id: false }) // No separate _id for embedded documents
class PublicationDoc {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  version: string;
}

const PublicationSchema = SchemaFactory.createForClass(PublicationDoc);

export enum TemplateDraftDocSchemaVersion {
  v1_0_0 = '1.0.0',
  v1_0_1 = '1.0.1',
  v1_0_2 = '1.0.2',
  v1_0_3 = '1.0.3',
}

@Schema({ collection: 'product_data_model_drafts' })
export class TemplateDraftDoc extends TemplateBaseDoc {
  @Prop({
    default: TemplateDraftDocSchemaVersion.v1_0_3,
    enum: TemplateDraftDocSchemaVersion,
  }) // Track schema version
  _schemaVersion: TemplateDraftDocSchemaVersion;

  @Prop({ type: [PublicationSchema], default: [] })
  publications: PublicationDoc[];
}

export const TemplateDraftSchema =
  SchemaFactory.createForClass(TemplateDraftDoc);

createCommonIndexesForTemplate(TemplateDraftSchema);
