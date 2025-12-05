import { z } from "zod";
import { nullishToOptional, ValueTypeSchema } from "./common/basic-json-schema";
import { ReferenceJsonSchema } from "./common/reference-json-schema";

export const ExtensionJsonSchema = z.object({
  name: z.string(),
  semanticId: nullishToOptional(ReferenceJsonSchema),
  supplementalSemanticIds: z.array(ReferenceJsonSchema).default([]),
  valueType: nullishToOptional(ValueTypeSchema),
  value: nullishToOptional(z.string()),
  refersTo: z.array(ReferenceJsonSchema).default([]),
});
