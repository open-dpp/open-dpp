import { z } from "zod";
import { ReferenceJsonSchema } from "./common/reference-json-schema";

export const SpecificAssetIdJsonSchema = z.object({
  name: z.string(),
  value: z.string(),
  semanticId: ReferenceJsonSchema.optional(),
  supplementalSemanticIds: z.array(ReferenceJsonSchema).default([]),
  externalSubjectId: ReferenceJsonSchema.optional(),
});
