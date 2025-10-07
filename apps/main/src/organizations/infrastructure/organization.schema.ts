import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export const OrganizationSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;

export type OrganizationSchemaVersion_TYPE = (typeof OrganizationSchemaVersion)[keyof typeof OrganizationSchemaVersion];

@Schema({ collection: "organization" })
export class OrganizationDoc extends Document {
  @Prop({
    default: OrganizationSchemaVersion.v1_0_0,
    enum: Object.values(OrganizationSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: OrganizationSchemaVersion_TYPE;

  @Prop({ required: true })
  // @ts-expect-error uses mongo id
  _id: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  createdByUserId: string;

  @Prop({ required: true })
  ownedByUserId: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: "UserDoc" }], default: [] })
  members: string[];
}
export const OrganizationDbSchema = SchemaFactory.createForClass(OrganizationDoc);

OrganizationDbSchema.index({ name: 1, createdByUserId: 1, ownedByUserId: 1 });
