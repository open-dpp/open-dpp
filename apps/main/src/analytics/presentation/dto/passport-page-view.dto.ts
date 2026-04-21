import { z } from "zod/v4";

export const PassportPageViewSchema = z.object({
  permalink: z.string(),
  page: z.string(),
});

export type PassportPageViewDto = z.infer<typeof PassportPageViewSchema>;
