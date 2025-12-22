import { z } from "zod";
import { ReferenceDbSchema } from "./common/reference-db-schema";

export const SpecificAssetIdDbSchema = z.object({
  name: z.string(),
  value: z.string(),
  semanticId: ReferenceDbSchema.nullish(),
  supplementalSemanticIds: z.array(ReferenceDbSchema).default([]),
  externalSubjectId: ReferenceDbSchema.nullish(),
});
