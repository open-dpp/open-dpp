import { z } from "zod";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";

export const BlobJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  contentType: z.string(),
  value: z.base64().nullish(),
});
