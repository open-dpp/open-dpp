import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MeasurementType, MetricValue } from '../domain/passport-metric';

export enum PassportMetricSchemaVersion {
  v1_0_0 = '1.0.0',
}

@Schema({ _id: false })
export class MetricValueDoc {
  @Prop({ required: true })
  key: string;
  @Prop({ required: true })
  value: number;
  @Prop({ required: false })
  row?: number;
}

const MetricValueSchema = SchemaFactory.createForClass(MetricValueDoc);

@Schema({
  collection: 'passport_metric',
  timeseries: {
    timeField: 'date',
    metaField: 'source',
    granularity: 'minutes',
  },
})
export class PassportMetricDoc extends Document {
  @Prop({ type: String, required: true })
  // @ts-expect-error uses mongo id
  _id: string;
  @Prop({
    default: PassportMetricSchemaVersion.v1_0_0,
    enum: PassportMetricSchemaVersion,
  }) // Track schema version
  _schemaVersion: PassportMetricSchemaVersion;

  @Prop({ type: Object, required: true })
  source: {
    modelId: string;
    templateId: string;
    organizationId: string;
    type: MeasurementType;
  };

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: [MetricValueSchema], default: [] })
  values: MetricValue[];
}

export const PassportMetricSchema =
  SchemaFactory.createForClass(PassportMetricDoc);

// PassportMetricSchema.index({ organizationId: 1, templateId: 1 });
