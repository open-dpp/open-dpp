import { z } from "zod";
import { PermalinkSchema } from "../permalinks/permalink.dto";

export const PassportPageViewSchema = z.object({
  permalink: PermalinkSchema,
  page: z.string(),
});

export type PassportPageViewDto = z.infer<typeof PassportPageViewSchema>;
