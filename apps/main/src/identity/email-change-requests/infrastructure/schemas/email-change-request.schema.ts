import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export const EMAIL_CHANGE_REQUEST_COLLECTION = "email_change_request";

export const EMAIL_CHANGE_REQUEST_TTL_SECONDS = 3600;

export const EmailChangeRequestSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;
export type EmailChangeRequestSchemaVersionType =
  (typeof EmailChangeRequestSchemaVersion)[keyof typeof EmailChangeRequestSchemaVersion];

export type EmailChangeRequestDocument = HydratedDocument<EmailChangeRequest>;

@Schema({
  collection: EMAIL_CHANGE_REQUEST_COLLECTION,
  autoCreate: process.env.NODE_ENV === "test",
})
export class EmailChangeRequest {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true })
  newEmail: string;

  @Prop({ required: true })
  previousEmail: string;

  @Prop({ required: true })
  requestedAt: Date;

  @Prop({
    required: true,
    default: EmailChangeRequestSchemaVersion.v1_0_0,
    enum: Object.values(EmailChangeRequestSchemaVersion),
    type: String,
  })
  _schemaVersion: EmailChangeRequestSchemaVersionType;
}

export const EmailChangeRequestSchema = SchemaFactory.createForClass(EmailChangeRequest);

EmailChangeRequestSchema.index(
  { requestedAt: 1 },
  { expireAfterSeconds: EMAIL_CHANGE_REQUEST_TTL_SECONDS },
);
