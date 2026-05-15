import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export const ActivityDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type ActivityDocVersionType = (typeof ActivityDocVersion)[keyof typeof ActivityDocVersion];

@Schema({ collection: "activities" })
export class ActivityDoc extends Document<string> {
  @Prop({
    default: ActivityDocVersion.v1_0_0,
    enum: Object.values(ActivityDocVersion),
    type: String,
  })
  _schemaVersion: ActivityDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: true })
  aggregateId: string;

  @Prop({ type: String, required: false })
  correlationId: string | null;

  @Prop({ required: true, immutable: true })
  createdAt: Date;

  @Prop({ type: String, required: false })
  type: string;

  @Prop({ type: String, required: false })
  userId: string | null;

  @Prop({ type: String, required: true })
  version: string;
  @Prop({ type: MongooseSchema.Types.Mixed })
  payload: unknown;
}

export const ActivityDbSchema = SchemaFactory.createForClass(ActivityDoc);
ActivityDbSchema.index({ aggregateId: 1, createdAt: 1 }, { background: true });

ActivityDbSchema.index({ type: 1, createdAt: 1 }, { background: true });
