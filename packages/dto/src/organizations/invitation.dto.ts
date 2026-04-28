import { z } from "zod";

export const InvitationResponseSchema = z.object({
  id: z.string(),
  expiresAt: z.iso.datetime(),
  organization: z
    .object({
      name: z.string(),
    })
    .optional(),
  inviter: z
    .object({
      name: z.string(),
    })
    .optional(),
});

export type InvitationResponseDto = z.infer<typeof InvitationResponseSchema>;
