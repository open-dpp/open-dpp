import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ collection: "organization" })
export class Organization {
    @Prop({ type: String, required: true })
    _id: string;

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

    @Prop({ required: true })
    updatedAt: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
