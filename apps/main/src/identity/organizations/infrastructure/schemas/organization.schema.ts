import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ collection: "organization" })
export class Organization {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  logo: string;

  @Prop({ type: Object })
  metadata: any;

  @Prop({ required: true })
  createdAt: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
