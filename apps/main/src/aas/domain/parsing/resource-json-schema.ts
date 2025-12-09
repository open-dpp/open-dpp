import { z } from "zod";

export const ResourceJsonSchema = z.object({
  path: z.string(),
  contentType: z.nullish(z.string()),
});
