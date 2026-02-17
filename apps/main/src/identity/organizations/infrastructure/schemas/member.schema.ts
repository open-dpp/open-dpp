import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import { MemberRole } from "../../domain/member-role.enum";

export type MemberDocument = HydratedDocument<Member>;

@Schema({ collection: "member" })
export class Member {
  @Prop({ type: String, required: true })
  _id: string;

  // Better Auth stores userId as ObjectId
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  userId: Types.ObjectId | string;

  // Better Auth stores organizationId as ObjectId
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, type: String })
  role: MemberRole;

  @Prop({ required: true })
  createdAt: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
MemberSchema.index({ organizationId: 1 });
