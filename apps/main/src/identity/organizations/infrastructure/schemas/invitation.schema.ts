import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { InvitationStatus } from "../../domain/invitation-status.enum";
import { MemberRole } from "../../domain/member-role.enum";

export type InvitationDocument = HydratedDocument<Invitation>;

@Schema({ collection: "invitation", autoCreate: process.env.NODE_ENV === "test" })
export class Invitation {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  inviterId: string;

  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true, enum: MemberRole, type: String })
  role: MemberRole;

  @Prop({ required: true, enum: InvitationStatus, type: String })
  status: InvitationStatus;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);
