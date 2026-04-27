import { z } from "zod";

export const InvitationResponseSchema = z.object({
  id: z.string(),
  expiresAt: z.iso.datetime(),
});

export type InvitationResponseDto = z.infer<typeof InvitationResponseSchema>;
