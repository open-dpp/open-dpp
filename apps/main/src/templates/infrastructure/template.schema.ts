import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { EnvironmentDoc, EnvironmentSchema } from "../../aas/infrastructure/schemas/environment.schema";

export const TemplateDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type TemplateDocVersionType = (typeof TemplateDocVersion)[keyof typeof TemplateDocVersion];

@Schema({ collection: "templates" })
export class TemplateDoc extends Document<string> {
  @Prop({
    default: TemplateDocVersion.v1_0_0,
    enum: Object.values(TemplateDocVersion),
    type: String,
  })
  _schemaVersion: TemplateDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: EnvironmentSchema, required: true })
  environment: EnvironmentDoc;

  @Prop({ required: true, immutable: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const TemplateSchema = SchemaFactory.createForClass(TemplateDoc);
TemplateSchema.index({ organizationId: 1, createdAt: 1, _id: 1 });
