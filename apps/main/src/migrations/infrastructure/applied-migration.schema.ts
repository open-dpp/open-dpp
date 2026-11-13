import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type AppliedMigrationDocument = HydratedDocument<AppliedMigrationDoc>;

@Schema({
  collection: "migrations",
  versionKey: false,
  autoCreate: process.env.NODE_ENV === "test",
})
export class AppliedMigrationDoc {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  appliedAt: Date;
}

export const AppliedMigrationSchema = SchemaFactory.createForClass(AppliedMigrationDoc);
