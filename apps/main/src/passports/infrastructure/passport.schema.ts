import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { EnvironmentDoc, EnvironmentSchema } from "../../aas/infrastructure/schemas/environment.schema";

export const PassportDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type PassportDocVersionType = (typeof PassportDocVersion)[keyof typeof PassportDocVersion];

@Schema({ collection: "passports" })
export class PassportDoc extends Document<string> {
  @Prop({
    default: PassportDocVersion.v1_0_0,
    enum: Object.values(PassportDocVersion),
    type: String,
  })
  _schemaVersion: PassportDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: false })
  templateId: string;

  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: EnvironmentSchema, required: true })
  environment: EnvironmentDoc;

  @Prop({ required: true, immutable: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const PassportSchema = SchemaFactory.createForClass(PassportDoc);
PassportSchema.index({ organizationId: 1, createdAt: 1 });
