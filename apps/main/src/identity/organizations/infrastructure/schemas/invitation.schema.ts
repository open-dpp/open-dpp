import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { MemberRole } from "../../domain/member-role.enum";

export type InvitationDocument = HydratedDocument<Invitation>;

@Schema({ collection: "invitation" })
export class Invitation {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  inviterId: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true, type: String })
  role: MemberRole;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);
