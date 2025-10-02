import type { Schema } from 'mongoose'
import type { DataValueDoc } from './data-value.schema'
import { Prop } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { DataValueSchema } from './data-value.schema'

export abstract class PassportDoc extends Document {
  @Prop({ required: true })
  // @ts-expect-error uses mongo id
  _id: string

  @Prop({ required: true })
  createdByUserId: string

  @Prop({ required: true })
  ownedByOrganizationId: string

  @Prop({ type: [DataValueSchema], default: [] })
  dataValues: DataValueDoc[]

  /** @deprecated Since model and item version 1.0.1. Use templateId instead */
  @Prop({ required: false })
  productDataModelId?: string

  @Prop({ required: true })
  templateId: string

  @Prop()
  createdAt?: Date

  @Prop()
  updatedAt?: Date
}

export function createCommonIndexesForPassportDoc(schema: Schema) {
  schema.index({ ownedByOrganizationId: 1 })
}
