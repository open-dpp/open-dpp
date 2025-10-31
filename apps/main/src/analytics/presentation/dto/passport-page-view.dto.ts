import { z } from "zod/v4";

export const PassportPageViewSchema = z.object({
  uuid: z.uuid(),
  page: z.string(),
});

export type PassportPageViewDto = z.infer<typeof PassportPageViewSchema>;
