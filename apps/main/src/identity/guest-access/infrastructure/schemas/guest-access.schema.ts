import type { GuestAccessKindType } from "../../domain/guest-access-kind.enum";
import type { GuestRoleType } from "../../domain/guest-role.enum";
import process from "node:process";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { GuestAccessKind } from "../../domain/guest-access-kind.enum";
import { GuestRole } from "../../domain/guest-role.enum";

export const GUEST_ACCESS_COLLECTION = "guest_access";

export const GuestAccessSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;
export type GuestAccessSchemaVersionType =
  (typeof GuestAccessSchemaVersion)[keyof typeof GuestAccessSchemaVersion];

export type GuestAccessDocument = HydratedDocument<GuestAccess>;

/**
 * One collection for all access kinds. `kind` selects the domain class; fields that only apply to
 * some kinds are optional here and required per kind.
 */
@Schema({ collection: GUEST_ACCESS_COLLECTION, autoCreate: process.env.NODE_ENV === "test" })
export class GuestAccess {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true, enum: Object.values(GuestAccessKind), type: String })
  kind: GuestAccessKindType;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true, enum: Object.values(GuestRole), type: String })
  guestRole: GuestRoleType;

  @Prop({ required: true })
  grantedBy: string;

  @Prop({ required: true })
  createdAt: Date;

  // Direct access: the invited email, normalized to lower case.
  @Prop({
    type: String,
    required: function (this: GuestAccess) {
      return this.kind === GuestAccessKind.DIRECT;
    },
  })
  email?: string;

  // Direct access: set once the invited person has accepted.
  @Prop({ type: String })
  acceptedByUserId?: string;

  @Prop({ type: Date })
  acceptedAt?: Date;

  @Prop({ type: Date })
  revokedAt?: Date;

  @Prop({
    required: true,
    default: GuestAccessSchemaVersion.v1_0_0,
    enum: Object.values(GuestAccessSchemaVersion),
    type: String,
  })
  _schemaVersion: GuestAccessSchemaVersionType;
}

export const GuestAccessSchema = SchemaFactory.createForClass(GuestAccess);

// Owner's guest list and the duplicate-invitation check. The leading organizationId also serves
// queries by organization alone.
GuestAccessSchema.index({ organizationId: 1, email: 1 });
// Authorization on every permalink request: the accesses a user has accepted in an organization.
// Pending invitations have no acceptedByUserId and stay out of this index.
GuestAccessSchema.index(
  { acceptedByUserId: 1, organizationId: 1 },
  { partialFilterExpression: { acceptedByUserId: { $exists: true } } },
);
