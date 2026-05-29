import { z } from "zod";

export const RequestEmailChangeDtoSchema = z.object({
  newEmail: z.email().toLowerCase(),
  currentPassword: z.string().min(1),
});

export type RequestEmailChangeDto = z.infer<typeof RequestEmailChangeDtoSchema>;
