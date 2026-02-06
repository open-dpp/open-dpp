import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { UserRole } from "../../domain/user-role.enum";

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: "user" })
export class User {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  name: string;

  @Prop()
  image: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ default: false })
  banned: boolean;

  @Prop({ default: null, type: String })
  banReason: string | null;

  @Prop({ default: null, type: Date })
  banExpires: Date | null;

  @Prop({ required: true, type: String })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
