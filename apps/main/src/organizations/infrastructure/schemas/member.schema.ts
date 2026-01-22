import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { OrganizationRole } from "../../domain/organization-role.enum";

export type MemberDocument = HydratedDocument<Member>;

@Schema({ collection: "member" })
export class Member {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, type: String })
  role: OrganizationRole;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
