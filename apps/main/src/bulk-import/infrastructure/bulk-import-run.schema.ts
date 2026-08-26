import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BulkImportRunStatusDto, type BulkImportRunStatusDtoType } from "@open-dpp/dto";
import { Document } from "mongoose";
import {
  MemberRole,
  type MemberRoleType,
} from "../../identity/organizations/domain/member-role.enum";
import { UserRole, type UserRoleType } from "../../identity/users/domain/user-role.enum";

export const BulkImportRunDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type BulkImportRunDocVersionType =
  (typeof BulkImportRunDocVersion)[keyof typeof BulkImportRunDocVersion];

@Schema({ collection: "bulk_import_runs" })
export class BulkImportRunDoc extends Document<string> {
  @Prop({
    default: BulkImportRunDocVersion.v1_0_0,
    enum: Object.values(BulkImportRunDocVersion),
    type: String,
  })
  _schemaVersion: BulkImportRunDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: true })
  bulkImportConfigId: string;

  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: String, enum: Object.values(BulkImportRunStatusDto), required: true })
  status: BulkImportRunStatusDtoType;

  @Prop({ type: String, enum: Object.values(UserRole), required: true })
  userRole: UserRoleType;

  @Prop({ type: String, enum: Object.values(MemberRole) })
  memberRole?: MemberRoleType;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: Number, required: true })
  totalCount: number;

  @Prop({ type: Number, required: true, default: 0 })
  succeededCount: number;

  @Prop({ type: Number, required: true, default: 0 })
  failedCount: number;

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  finishedAt: Date | null;

  @Prop({ required: true, immutable: true })
  createdAt: Date;
}

export const BulkImportRunSchema = SchemaFactory.createForClass(BulkImportRunDoc);
BulkImportRunSchema.index({ bulkImportConfigId: 1, createdAt: -1 });
BulkImportRunSchema.index({ status: 1 });
