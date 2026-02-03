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

  @Prop()
  ipAddress?: string | null;

  @Prop()
  userAgent?: string | null;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop()
  activeOrganizationId: string | null;

  @Prop()
  activeTeamId: string | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
export type SessionSchemaType = InferSchemaType<typeof SessionSchema>;

// Indexes
SessionSchema.index({ token: 1 });
SessionSchema.index({ userId: 1 });
