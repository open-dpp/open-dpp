import { z } from "zod";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";

export const FileJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  contentType: z.string(),
  value: z.nullish(z.string()),
});
