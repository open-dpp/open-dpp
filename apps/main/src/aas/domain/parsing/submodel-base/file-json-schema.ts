import { z } from "zod";
import { nullishToOptional } from "../common/basic-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";

export const FileJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  contentType: z.string(),
  value: nullishToOptional(z.string()),
});
