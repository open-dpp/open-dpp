import type { TraceabilityEvent } from '../domain/traceability-event'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { TraceabilityEventType } from '../domain/traceability-event-type.enum'

export enum TraceabilityEventSchemaVersion {
  v1_0_0 = '1.0.0',
}

/**
 * TraceabilityEvent schema
 */
@Schema({ collection: 'traceability_events', timestamps: true })
export class TraceabilityEventDocument extends Document {
  @Prop({ required: true })
  // @ts-expect-error uses mongo id
  _id: string

  @Prop({
    default: TraceabilityEventSchemaVersion.v1_0_0,
    enum: TraceabilityEventSchemaVersion,
  })
  _schemaVersion: TraceabilityEventSchemaVersion

  @Prop({ required: true })
  createdAt: Date

  @Prop({ required: true })
  updatedAt: Date

  @Prop({ required: false, default: null, type: String })
  ip: string | null

  @Prop({ required: false, default: null, type: String })
  userId: string | null

  @Prop({ required: false, default: null, type: String })
  itemId: string | null

  @Prop({ required: false, default: null, type: String })
  chargeId: string | null

  @Prop({ required: false, default: null, type: String })
  organizationId: string | null

  @Prop({ required: false, default: null, type: Object })
  geolocation: {
    latitude: string
    longitude: string
  } | null

  @Prop({
    required: false,
    enum: TraceabilityEventType,
    type: String,
  })
  type: TraceabilityEventType

  @Prop({
    type: Object,
    required: true,
  })
  data: TraceabilityEvent
}

export const DppEventSchema = SchemaFactory.createForClass(
  TraceabilityEventDocument,
)
