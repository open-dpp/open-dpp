import { z } from "zod";
import { LanguageTextJsonSchema } from "../common/language-text-json-schema";
import { QualifierJsonSchema } from "../common/qualifier-json-schema";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { EmbeddedDataSpecificationJsonSchema } from "../embedded-data-specification-json-schema";

export const SubmodelBaseJsonSchema = z.object({
  category: z.nullish(z.string()),
  idShort: z.string(),
  displayName: z.array(LanguageTextJsonSchema).default([]),
  description: z.array(LanguageTextJsonSchema).default([]),
  semanticId: z.nullish(ReferenceJsonSchema),
  supplementalSemanticIds: z.array(ReferenceJsonSchema).default([]),
  qualifiers: z.array(QualifierJsonSchema).default([]),
  embeddedDataSpecifications: z.array(EmbeddedDataSpecificationJsonSchema).default([]),
});
