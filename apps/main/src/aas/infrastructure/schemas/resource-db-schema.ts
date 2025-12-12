import { z } from "zod";

export const ResourceDbSchema = z.object({
  path: z.string(),
  contentType: z.nullish(z.string()),
});
