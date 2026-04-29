import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export const AuditEventDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type AuditEventDocVersionType = (typeof AuditEventDocVersion)[keyof typeof AuditEventDocVersion];

@Schema({ collection: "audit_events" })
export class AuditEventDoc extends Document<string> {
  @Prop({
    default: AuditEventDocVersion.v1_0_0,
    enum: Object.values(AuditEventDocVersion),
    type: String,
  })
  _schemaVersion: AuditEventDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: true })
  aggregateId: string;

  @Prop({ type: String, required: true })
  correlationId: string;

  @Prop({ required: true, immutable: true })
  timestamp: Date;

  @Prop({ type: String, required: false })
  type: string;

  @Prop({ type: String, required: false })
  userId: string | null;

  @Prop({ type: String, required: true })
  version: string;
  @Prop({ type: MongooseSchema.Types.Mixed })
  payload: unknown;
}

export const AuditEventDbSchema = SchemaFactory.createForClass(AuditEventDoc);
AuditEventDbSchema.index({ aggregateId: 1, timestamp: 1 }, { background: true });

AuditEventDbSchema.index({ type: 1, timestamp: 1 }, { background: true });
