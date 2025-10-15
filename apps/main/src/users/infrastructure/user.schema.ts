import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const UserSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;

export type UserSchemaVersion_TYPE = (typeof UserSchemaVersion)[keyof typeof UserSchemaVersion];

@Schema({ collection: "user", timestamps: true })
export class UserDoc extends Document {
  @Prop({
    default: UserSchemaVersion.v1_0_0,
    enum: Object.values(UserSchemaVersion),
    type: String,
  })
  _schemaVersion: UserSchemaVersion_TYPE;

  @Prop({ required: true })
  // @ts-expect-error uses mongo id
  _id: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  keycloakUserId: string;

  @Prop({ type: [String], default: [] })
  organizations: string[];
}
export const UserDbSchema = SchemaFactory.createForClass(UserDoc);

UserDbSchema.index({ email: 1 });
