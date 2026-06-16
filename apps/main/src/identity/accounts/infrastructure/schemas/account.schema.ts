import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, SchemaTypes, Types } from "mongoose";

export type AccountDocument = HydratedDocument<Account>;

// Read-only mirror of better-auth's `account` collection (see ADR-0002). Better Auth is the
// sole writer; the app only reads this to verify a User's current password. `_id` and `userId`
// are persisted by better-auth as ObjectId — typing them faithfully is what lets the repository
// match by userId (a string-typed `userId` would silently never match the stored ObjectId).
@Schema({ collection: "account", autoCreate: process.env.NODE_ENV === "test" })
export class Account {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  _id: Types.ObjectId;

  // Better Auth stores userId as ObjectId; Mixed lets an ObjectId query value pass through uncast.
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
