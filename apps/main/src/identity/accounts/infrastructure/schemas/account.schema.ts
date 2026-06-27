import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, SchemaTypes, Types } from "mongoose";

export type AccountDocument = HydratedDocument<Account>;

@Schema({ collection: "account", autoCreate: process.env.NODE_ENV === "test" })
export class Account {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  userId: Types.ObjectId | string;

  @Prop({ required: true })
  accountId: string;

  @Prop({ required: true })
  providerId: string;

  @Prop()
  accessToken: string;

  @Prop()
  refreshToken: string;

  @Prop()
  accessTokenExpiresAt: Date;

  @Prop()
  refreshTokenExpiresAt: Date;

  @Prop()
  scope: string;

  @Prop()
  idToken: string;

  @Prop()
  password: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
