import { z } from "zod";

export const GuestRoleDto = {
  REPAIRER: "Repairer",
  RECYCLER: "Recycler",
  MARKET_SURVEILLANCE: "MarketSurveillance",
  INDEPENDENT_OPERATOR: "IndependentOperator",
  SUPPLIER: "Supplier",
} as const;

export const GuestRoleDtoEnum = z.enum(GuestRoleDto);
export type GuestRoleDtoType = z.infer<typeof GuestRoleDtoEnum>;

export const GuestAccessKindDto = {
  DIRECT: "Direct",
} as const;

export const GuestAccessKindDtoEnum = z.enum(GuestAccessKindDto);
export type GuestAccessKindDtoType = z.infer<typeof GuestAccessKindDtoEnum>;

export const GuestAccessStatusDto = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REVOKED: "Revoked",
} as const;

export const GuestAccessStatusDtoEnum = z.enum(GuestAccessStatusDto);
export type GuestAccessStatusDtoType = z.infer<typeof GuestAccessStatusDtoEnum>;

export const CreateDirectGuestAccessDtoSchema = z.object({
  kind: z.literal(GuestAccessKindDto.DIRECT),
  email: z.email(),
  guestRole: GuestRoleDtoEnum,
});

export const CreateGuestAccessDtoSchema = z.discriminatedUnion("kind", [
  CreateDirectGuestAccessDtoSchema,
]);

export type CreateGuestAccessDto = z.infer<typeof CreateGuestAccessDtoSchema>;

export const UpdateGuestAccessRoleDtoSchema = z.object({
  guestRole: GuestRoleDtoEnum,
});

export type UpdateGuestAccessRoleDto = z.infer<typeof UpdateGuestAccessRoleDtoSchema>;

const GuestAccessBaseResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  guestRole: GuestRoleDtoEnum,
  grantedBy: z.string(),
  status: GuestAccessStatusDtoEnum,
  createdAt: z.iso.datetime(),
  revokedAt: z.iso.datetime().optional(),
});

export const DirectGuestAccessResponseDtoSchema = GuestAccessBaseResponseSchema.extend({
  kind: z.literal(GuestAccessKindDto.DIRECT),
  email: z.email(),
  acceptedAt: z.iso.datetime().optional(),
  acceptedByUserId: z.string().optional(),
});

export const GuestAccessResponseDtoSchema = z.discriminatedUnion("kind", [
  DirectGuestAccessResponseDtoSchema,
]);

export type GuestAccessResponseDto = z.infer<typeof GuestAccessResponseDtoSchema>;
