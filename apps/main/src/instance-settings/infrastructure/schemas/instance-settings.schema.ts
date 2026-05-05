import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type InstanceSettingsDocument = HydratedDocument<InstanceSettingsSchema>;

export const InstanceSettingsDocVersion = {
  v1_0_0: "1.0.0",
  v1_1_0: "1.1.0",
} as const;
type InstanceSettingsDocVersionType =
  (typeof InstanceSettingsDocVersion)[keyof typeof InstanceSettingsDocVersion];

@Schema({ collection: "instance_settings", autoCreate: process.env.NODE_ENV === "test" })
export class InstanceSettingsSchema {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true, default: true })
  signupEnabled: boolean;

  @Prop({ required: true, default: true })
  organizationCreationEnabled: boolean;

  @Prop({
    required: true,
    default: InstanceSettingsDocVersion.v1_1_0,
    enum: Object.values(InstanceSettingsDocVersion),
    type: String,
  })
  _schemaVersion: InstanceSettingsDocVersionType;
}

export const InstanceSettingsMongooseSchema = SchemaFactory.createForClass(InstanceSettingsSchema);
