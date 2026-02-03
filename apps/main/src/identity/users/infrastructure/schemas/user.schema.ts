import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { UserRole } from "../../domain/user-role.enum";

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: "user" })
export class User {
  @Prop({ type: String, required: true })
  _id: string; // better-auth uses string IDs, likely we map _id to it or it sets _id as string. Let's assume _id IS the string ID.

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

  @Prop({ required: true, type: String })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
