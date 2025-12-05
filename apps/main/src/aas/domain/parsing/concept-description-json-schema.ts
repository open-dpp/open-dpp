import { z } from "zod";
import { AdministrativeInformationJsonSchema } from "./administrative-information-json-schema";
import { nullishToOptional } from "./common/basic-json-schema";
import { LanguageTextJsonSchema } from "./common/language-text-json-schema";
import { ReferenceJsonSchema } from "./common/reference-json-schema";
import { EmbeddedDataSpecificationJsonSchema } from "./embedded-data-specification-json-schema";
import { ExtensionJsonSchema } from "./extension-json-schema";

export const ConceptDescriptionJsonSchema = z.object({
  id: z.string(),
  extensions: ExtensionJsonSchema.array().default([]),
  category: nullishToOptional(z.string()),
  idShort: nullishToOptional(z.string()),
  displayName: LanguageTextJsonSchema.array().default([]),
  description: LanguageTextJsonSchema.array().default([]),
  semanticId: nullishToOptional(ReferenceJsonSchema),
  administration: nullishToOptional(AdministrativeInformationJsonSchema),
  embeddedDataSpecifications: EmbeddedDataSpecificationJsonSchema.array().default([]),
  isCaseOf: ReferenceJsonSchema.array().default([]),
});
