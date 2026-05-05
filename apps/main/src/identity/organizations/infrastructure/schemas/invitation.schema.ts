import type { MemberRoleType } from "../../domain/member-role.enum";
import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { InvitationStatus } from "../../domain/invitation-status.enum";
import { MemberRole } from "../../domain/member-role.enum";

export type InvitationDocument = HydratedDocument<InvitationDoc>;

@Schema({ collection: "invitation", autoCreate: process.env.NODE_ENV === "test" })
export class InvitationDoc {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  inviterId: string;

  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true, enum: Object.values(MemberRole), type: String })
  role: MemberRoleType;

  @Prop({ required: true, enum: InvitationStatus, type: String })
  status: InvitationStatus;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(InvitationDoc);
