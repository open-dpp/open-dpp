import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import {
  createCommonIndexesForPassportDoc,
  PassportDoc,
} from '../../product-passport-data/infrastructure/product-passport-data.schema'

export const ModelDocSchemaVersion = {
  v1_0_0: '1.0.0',
  v1_0_1: '1.0.1',
} as const

export type ModelDocSchemaVersion_TYPE = (typeof ModelDocSchemaVersion)[keyof typeof ModelDocSchemaVersion]

@Schema({ collection: 'models', timestamps: true })
export class ModelDoc extends PassportDoc {
  @Prop({ required: true })
  name: string

  @Prop({
    default: ModelDocSchemaVersion.v1_0_1,
    enum: ModelDocSchemaVersion,
  }) // Track schema version
  _schemaVersion: ModelDocSchemaVersion_TYPE

  @Prop({ required: false })
  description?: string
}
export const ModelSchema = SchemaFactory.createForClass(ModelDoc)

createCommonIndexesForPassportDoc(ModelSchema)
