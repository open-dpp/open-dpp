import { z } from "zod";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";

export const FileDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  contentType: z.string(),
  value: z.nullish(z.string()),
});
