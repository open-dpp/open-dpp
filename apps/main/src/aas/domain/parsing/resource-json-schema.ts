import { z } from "zod";
import { nullishToOptional } from "./common/basic-json-schema";

export const ResourceJsonSchema = z.object({
  path: z.string(),
  contentType: nullishToOptional(z.string()),
});
