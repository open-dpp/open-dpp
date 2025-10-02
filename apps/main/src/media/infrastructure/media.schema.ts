import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum MediaSchemaVersion {
  v1_0_0 = '1.0.0',
}

@Schema({ collection: 'media' })
export class MediaDoc extends Document {
  @Prop({
    default: MediaSchemaVersion.v1_0_0,
    enum: MediaSchemaVersion,
  }) // Track schema version
  _schemaVersion: MediaSchemaVersion

  @Prop({ required: true })
  // @ts-expect-error uses mongo id
  _id: string

  @Prop({ required: true })
  title: string

  @Prop({ required: true })
  description: string

  @Prop({ required: true })
  mimeType: string

  @Prop({ required: true })
  fileExtension: string

  @Prop({ required: true })
  size: number

  @Prop({ required: true })
  originalFilename: string

  @Prop({ required: true })
  ownedByOrganizationId: string

  @Prop({ required: true })
  createdByUserId: string

  @Prop({ type: 'string', required: false })
  uniqueProductIdentifier: string | null

  @Prop({ type: 'string', required: false })
  dataFieldId: string | null

  @Prop({ required: true })
  bucket: string

  @Prop({ required: true })
  objectName: string

  @Prop({ required: true })
  eTag: string

  @Prop({ required: true })
  versionId: string

  @Prop({ required: true })
  createdAt: Date

  @Prop({ required: true })
  updatedAt: Date
}
export const MediaDbSchema = SchemaFactory.createForClass(MediaDoc)

MediaDbSchema.index({ organizationName: 1, sectors: 1 })
