import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { AiProvider } from '../domain/ai-configuration'

export enum AiConfigurationSchemaVersion {
  v1_0_0 = '1.0.0',
}

@Schema({ collection: 'configuration' })
export class AiConfigurationDoc extends Document {
  @Prop({
    default: AiConfigurationSchemaVersion.v1_0_0,
    enum: AiConfigurationSchemaVersion,
  }) // Track schema version
  _schemaVersion: AiConfigurationSchemaVersion

  @Prop({ required: true, immutable: true })
  // @ts-expect-error id from mongo
  _id: string

  @Prop({ required: true, immutable: true })
  ownedByOrganizationId: string

  @Prop({ required: true, immutable: true })
  createdByUserId: string

  @Prop({ required: true })
  isEnabled: boolean

  @Prop({ required: true, enum: AiProvider, type: String })
  provider: AiProvider

  @Prop({ required: true })
  aiModel: string

  @Prop({ required: true, immutable: true })
  createdAt: Date

  @Prop({ required: true })
  updatedAt: Date
}
export const AiConfigurationDbSchema
  = SchemaFactory.createForClass(AiConfigurationDoc)

AiConfigurationDbSchema.index({ ownedByOrganizationId: 1 }, { unique: true })
