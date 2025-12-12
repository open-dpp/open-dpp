import { z } from "zod";
import { AdministrativeInformationDbSchema } from "./administrative-information-db-schema";
import { LanguageTextDbSchema } from "./common/language-text-db-schema";
import { ReferenceDbSchema } from "./common/reference-db-schema";
import { EmbeddedDataSpecificationDbSchema } from "./embedded-data-specification-db-schema";
import { ExtensionDbSchema } from "./extension-db-schema";

export const ConceptDescriptionDbSchema = z.object({
  id: z.string(),
  extensions: ExtensionDbSchema.array().default([]),
  category: z.nullish(z.string()),
  idShort: z.nullish(z.string()),
  displayName: LanguageTextDbSchema.array().default([]),
  description: LanguageTextDbSchema.array().default([]),
  semanticId: z.nullish(ReferenceDbSchema),
  administration: z.nullish(AdministrativeInformationDbSchema),
  embeddedDataSpecifications: EmbeddedDataSpecificationDbSchema.array().default([]),
  isCaseOf: ReferenceDbSchema.array().default([]),
});
