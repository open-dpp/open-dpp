import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import { Sector } from '../../data-modelling/domain/sectors';

export enum PassportTemplatePublicationSchemaVersion {
  v1_0_0 = '1.0.0',
}

@Schema({ collection: 'passport_template_publications' })
export class PassportTemplatePublicationDoc extends Document {
  @Prop({
    default: PassportTemplatePublicationSchemaVersion.v1_0_0,
    enum: PassportTemplatePublicationSchemaVersion,
  }) // Track schema version
  _schemaVersion: PassportTemplatePublicationSchemaVersion;

  @Prop({ required: true })
  // @ts-expect-error uses mongo _id
  _id: string;
  @Prop({ required: true })
  version: string;
  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  description: string;
  @Prop({ required: true })
  isOfficial: boolean;
  @Prop({ required: true, type: [String], enum: Sector })
  sectors: Sector[];
  @Prop({ required: false, default: null })
  website: string;
  @Prop({ required: true })
  contactEmail: string;
  @Prop({ required: true })
  organizationName: string;
  @Prop({ required: true })
  ownedByOrganizationId: string;
  @Prop({ required: true })
  createdByUserId: string;
  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  templateData: Record<string, unknown>;
  @Prop({ required: true })
  createdAt: Date;
  @Prop({ required: true })
  updatedAt: Date;
}
export const PassportTemplatePublicationDbSchema = SchemaFactory.createForClass(
  PassportTemplatePublicationDoc,
);

PassportTemplatePublicationDbSchema.index({ organizationName: 1, sectors: 1 });
