import { z } from "zod";

export const RequestEmailChangeDtoSchema = z.object({
  newEmail: z.email(),
});

export type RequestEmailChangeDto = z.infer<typeof RequestEmailChangeDtoSchema>;
