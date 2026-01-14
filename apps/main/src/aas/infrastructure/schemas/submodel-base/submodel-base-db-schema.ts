import { z } from "zod";
import { LanguageTextDbSchema } from "../common/language-text-db-schema";
import { QualifierDbSchema } from "../common/qualifier-db-schema";
import { ReferenceDbSchema } from "../common/reference-db-schema";
import { EmbeddedDataSpecificationDbSchema } from "../embedded-data-specification-db-schema";

export const SubmodelBaseDbSchema = z.object({
  category: z.nullish(z.string()),
  idShort: z.string(),
  displayName: z.array(LanguageTextDbSchema).default([]),
  description: z.array(LanguageTextDbSchema).default([]),
  semanticId: z.nullish(ReferenceDbSchema),
  supplementalSemanticIds: z.array(ReferenceDbSchema).default([]),
  qualifiers: z.array(QualifierDbSchema).default([]),
  embeddedDataSpecifications: z.array(EmbeddedDataSpecificationDbSchema).default([]),
});
