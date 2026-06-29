import { z } from "zod";

export const PendingEmailChangeDtoSchema = z.object({
  newEmail: z.email(),
  requestedAt: z.coerce.date(),
});

export type PendingEmailChangeDto = z.infer<typeof PendingEmailChangeDtoSchema>;
