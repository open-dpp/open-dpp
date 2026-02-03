import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { MemberRole } from "../../domain/member-role.enum";

export type MemberDocument = HydratedDocument<Member>;

@Schema({ collection: "member" })
export class Member {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true, type: String })
  role: MemberRole;

  @Prop({ required: true })
  createdAt: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
