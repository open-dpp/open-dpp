import type { CreateIndexesOptions } from "mongodb";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const MediaSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;

export type MediaSchemaVersion_TYPE = (typeof MediaSchemaVersion)[keyof typeof MediaSchemaVersion];

export const MEDIA_COLLECTION = "media";

/**
 * A passport field holds one media at most. Only media with both a passport and a field are
 * covered, so the media of the library, which have neither, are not. Databases that held
 * several media of a field before get the index from migration
 * `20261118180926-unique-passport-field-media`, which builds it with these same options.
 */
export const PASSPORT_FIELD_MEDIA_INDEX = {
  fields: { uniqueProductIdentifier: 1, dataFieldId: 1 },
  options: {
    unique: true,
    partialFilterExpression: {
      uniqueProductIdentifier: { $type: "string" },
      dataFieldId: { $type: "string" },
    },
  },
} as const satisfies {
  fields: Record<string, 1>;
  options: CreateIndexesOptions;
};

@Schema({ collection: MEDIA_COLLECTION })
export class MediaDoc extends Document {
  @Prop({
    default: MediaSchemaVersion.v1_0_0,
    enum: Object.values(MediaSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: MediaSchemaVersion_TYPE;

  @Prop({ required: true })
  // @ts-expect-error uses mongo id
  _id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  fileExtension: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  originalFilename: string;

  @Prop({ required: true })
  ownedByOrganizationId: string;

  @Prop({ required: true })
  createdByUserId: string;

  // The user who last replaced the file. Not set on media that were never replaced.
  @Prop({ type: "string", required: false })
  updatedByUserId: string | null;

  @Prop({ type: "string", required: false })
  uniqueProductIdentifier: string | null;

  @Prop({ type: "string", required: false })
  dataFieldId: string | null;

  @Prop({ required: true })
  bucket: string;

  @Prop({ required: true })
  objectName: string;

  @Prop({ required: true })
  eTag: string;

  @Prop({ required: true })
  versionId: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}
export const MediaDbSchema = SchemaFactory.createForClass(MediaDoc);

MediaDbSchema.index({ organizationName: 1, sectors: 1 });
MediaDbSchema.index(PASSPORT_FIELD_MEDIA_INDEX.fields, PASSPORT_FIELD_MEDIA_INDEX.options);
