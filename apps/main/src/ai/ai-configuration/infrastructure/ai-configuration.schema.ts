import type { AiProvider_TYPE } from "../domain/ai-configuration";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { AiProvider } from "../domain/ai-configuration";

export const AiConfigurationSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;

export type AiConfigurationSchemaVersion_TYPE = (typeof AiConfigurationSchemaVersion)[keyof typeof AiConfigurationSchemaVersion];

@Schema({ collection: "configuration" })
export class AiConfigurationDoc extends Document {
  @Prop({
    default: AiConfigurationSchemaVersion.v1_0_0,
    enum: AiConfigurationSchemaVersion,
  }) // Track schema version
  _schemaVersion: AiConfigurationSchemaVersion_TYPE;

  @Prop({ required: true, immutable: true })
  // @ts-expect-error id from mongo
  _id: string;

  @Prop({ required: true, immutable: true })
  ownedByOrganizationId: string;

  @Prop({ required: true, immutable: true })
  createdByUserId: string;

  @Prop({ required: true })
  isEnabled: boolean;

  @Prop({ required: true, enum: AiProvider, type: String })
  provider: AiProvider_TYPE;

  @Prop({ required: true })
  aiModel: string;

  @Prop({ required: true, immutable: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}
export const AiConfigurationDbSchema
  = SchemaFactory.createForClass(AiConfigurationDoc);

AiConfigurationDbSchema.index({ ownedByOrganizationId: 1 }, { unique: true });
