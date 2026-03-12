import type { AccessControlDb } from "./access-control-db-schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { z } from "zod/v4";
import { AccessControlDbSchema } from "./access-control-db-schema";

export const SecurityDocSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;
type SecurityDocSchemaVersionType = (typeof SecurityDocSchemaVersion)[keyof typeof SecurityDocSchemaVersion];

@Schema({ collection: "aas_security" })
export class SecurityDoc extends Document<string> {
  @Prop({ type: String })
  declare _id: string;

  @Prop({
    default: SecurityDocSchemaVersion.v1_0_0,
    enum: Object.values(SecurityDocSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: SecurityDocSchemaVersionType;

  @Prop({ type: MongooseSchema.Types.Mixed })
  localAccessControl: AccessControlDb;
}

export const SecurityDbSchema = SchemaFactory.createForClass(SecurityDoc);

export const SecurityDbValidationSchema = z.object({
  id: z.uuid(),
  localAccessControl: AccessControlDbSchema,
});
