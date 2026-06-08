import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export const EMAIL_CHANGE_REQUEST_COLLECTION = "email_change_request";

/**
 * Lifetime of an Email Change Request, used to drive the Mongo TTL index on `requestedAt`.
 *
 * This MUST stay aligned with better-auth's `emailVerification.expiresIn` (the auth provider
 * imports this same constant): per ADR-0001 the request and the verification token share one
 * lifetime so the two cannot drift. Changing this value changes the verification window too.
 */
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

// No unique index on newEmail: per ADR-0001 the gate resolves the request by userId, so there
// is no cross-user address reservation. Real address uniqueness is enforced at completion by the
// user.email unique constraint. The request instead expires via a TTL aligned to better-auth's
// emailVerification.expiresIn (see EMAIL_CHANGE_REQUEST_TTL_SECONDS).
EmailChangeRequestSchema.index(
  { requestedAt: 1 },
  { expireAfterSeconds: EMAIL_CHANGE_REQUEST_TTL_SECONDS },
);
