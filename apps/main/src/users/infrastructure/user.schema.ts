import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export const UserSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;

export type UserSchemaVersion_TYPE = (typeof UserSchemaVersion)[keyof typeof UserSchemaVersion];

@Schema({ collection: "user" })
export class UserDoc extends Document {
  @Prop({
    default: UserSchemaVersion.v1_0_0,
    enum: Object.values(UserSchemaVersion),
    type: String,
  }) // Track schema version
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

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: "OrganizationDoc" }], default: [] })
  organizations: string[];
}
export const UserDbSchema = SchemaFactory.createForClass(UserDoc);

UserDbSchema.index({ email: 1 });
