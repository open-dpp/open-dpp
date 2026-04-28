import { z } from "zod";

export const InvitationStatusDto = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;

export const InvitationStatusDtoEnum = z.enum(InvitationStatusDto);

export type InvitationStatusDtoType = z.infer<typeof InvitationStatusDtoEnum>;

export const InvitationResponseSchema = z.object({
  id: z.string(),
  expiresAt: z.iso.datetime(),
  organization: z
    .object({
      name: z.string(),
    })
    .optional(),
  status: InvitationStatusDtoEnum,
  inviter: z
    .object({
      name: z.string(),
    })
    .optional(),
  organizationId: z.string(),
});

export type InvitationResponseDto = z.infer<typeof InvitationResponseSchema>;
