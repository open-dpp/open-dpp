import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type InstanceSettingsDocument = HydratedDocument<InstanceSettingsSchema>;

export const INSTANCE_SETTINGS_SCHEMA_VERSION = "1.0.0";

@Schema({ collection: "instance_settings", autoCreate: process.env.NODE_ENV === "test" })
export class InstanceSettingsSchema {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true, default: true })
  signupEnabled: boolean;

  @Prop({ required: true, default: INSTANCE_SETTINGS_SCHEMA_VERSION })
  _schemaVersion: string;
}

export const InstanceSettingsMongooseSchema = SchemaFactory.createForClass(InstanceSettingsSchema);
