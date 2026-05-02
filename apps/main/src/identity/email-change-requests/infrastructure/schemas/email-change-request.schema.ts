import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export const EMAIL_CHANGE_REQUEST_COLLECTION = "email_change_request";

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
  requestedAt: Date;
}

export const EmailChangeRequestSchema = SchemaFactory.createForClass(EmailChangeRequest);
