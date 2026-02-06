import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, InferSchemaType } from "mongoose";

export type SessionDocument = HydratedDocument<Session>;

@Schema({ collection: "session" })
export class Session {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: String })
  ipAddress?: string | null;

  @Prop({ type: String })
  userAgent?: string | null;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ type: String })
  activeOrganizationId: string | null;

  @Prop({ type: String })
  activeTeamId: string | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
export type SessionSchemaType = InferSchemaType<typeof SessionSchema>;

// Indexes
// Token index is already defined via @Prop({ unique: true })
SessionSchema.index({ userId: 1 });
