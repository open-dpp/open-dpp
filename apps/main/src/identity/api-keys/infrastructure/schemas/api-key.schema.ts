import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes } from "mongoose";

export type ApiKeyDocument = HydratedDocument<ApiKeyDoc>;

/**
 * Read-only Mongoose view over better-auth's `apikey` collection.
 * Writes go through `auth.api` (see ApiKeysRepository) so key hashing and
 * ownership checks stay in better-auth. `_id` and `referenceId` are Mixed:
 * better-auth stores string ids while its adapter may store reference
 * fields as ObjectId — Mixed disables Mongoose casting on both.
 */
@Schema({ collection: "apikey", autoCreate: process.env.NODE_ENV === "test" })
export class ApiKeyDoc {
  @Prop({ type: SchemaTypes.Mixed })
  _id: unknown;

  @Prop({ type: SchemaTypes.Mixed, index: true })
  referenceId: unknown;

  @Prop({ type: String })
  name: string | null;

  @Prop({ type: String })
  start: string | null;

  @Prop({ type: Date })
  expiresAt: Date | null;

  @Prop({ type: Date })
  lastRequest: Date | null;

  @Prop({ required: true })
  createdAt: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKeyDoc);
