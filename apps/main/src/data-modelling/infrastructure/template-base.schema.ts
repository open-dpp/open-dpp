import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { DataFieldType } from '../domain/data-field-base';
import { SectionType } from '../domain/section-base';
import { GranularityLevel } from '../domain/granularity-level';
import {Sector} from '@open-dpp/api-client';

@Schema()
export class DataFieldDoc {
  @Prop({ required: true })
  _id: string;
  @Prop({ required: true })
  name: string;
  @Prop({ required: true, enum: DataFieldType, type: String })
  type: DataFieldType;
  @Prop({ required: true, type: MongooseSchema.Types.Mixed }) // Accepts any JSON object
  options: Record<string, unknown>;
  @Prop({
    required: true,
    enum: GranularityLevel,
    default: GranularityLevel.MODEL, type: String
  })
  granularityLevel: GranularityLevel;
  /** @deprecated Since template and template draft version 1.0.2. Use templateId instead */
  @Prop({ required: false, type: MongooseSchema.Types.Mixed })
  layout: Record<string, unknown>;
}

const DataFieldSchema = SchemaFactory.createForClass(DataFieldDoc);

@Schema()
export class SectionDoc {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: SectionType, type: String })
  type: SectionType;
  @Prop({ type: [DataFieldSchema], default: [] })
  dataFields: DataFieldDoc[];

  /** @deprecated Since template version and template draft 1.0.2. Use templateId instead */
  @Prop({ required: false, type: MongooseSchema.Types.Mixed })
  layout: Record<string, unknown>;

  @Prop({ required: false })
  parentId?: string;

  @Prop({ default: [] })
  subSections: string[];

  @Prop({
    enum: GranularityLevel, type: String
  })
  granularityLevel?: GranularityLevel;
}

const SectionSchema = SchemaFactory.createForClass(SectionDoc);

export abstract class TemplateBaseDoc extends Document {
    @Prop({ required: true })
        // @ts-ignore
    _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    default: 'Passvorlage',
  })
  description: string;

  @Prop({
    required: true,
    type: [String],
    enum: Sector,
    default: [Sector.OTHER],
  })
  sectors: Sector[];

  @Prop({ required: true })
  version: string;

  @Prop({ type: [SectionSchema], default: [] })
  sections: SectionDoc[];

  @Prop({ required: true })
  createdByUserId: string;

  @Prop({ required: true })
  ownedByOrganizationId: string;
}

export function createCommonIndexesForTemplate(schema: MongooseSchema) {
  schema.index({ ownedByOrganizationId: 1 });
}
