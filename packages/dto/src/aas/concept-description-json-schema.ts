import { z } from 'zod'
import { AdministrativeInformationJsonSchema } from './administrative-information-json-schema'
import { LanguageTextJsonSchema } from './common/language-text-json-schema'
import { ReferenceJsonSchema } from './common/reference-json-schema'
import { EmbeddedDataSpecificationJsonSchema } from './embedded-data-specification-json-schema'
import { ExtensionJsonSchema } from './extension-json-schema'

export const ConceptDescriptionJsonSchema = z.object({
  id: z.string(),
  extensions: ExtensionJsonSchema.array().default([]),
  category: z.nullish(z.string()),
  idShort: z.nullish(z.string()),
  displayName: LanguageTextJsonSchema.array().default([]),
  description: LanguageTextJsonSchema.array().default([]),
  semanticId: z.nullish(ReferenceJsonSchema),
  administration: z.nullish(AdministrativeInformationJsonSchema),
  embeddedDataSpecifications: EmbeddedDataSpecificationJsonSchema.array().default([]),
  isCaseOf: ReferenceJsonSchema.array().default([]),
})
