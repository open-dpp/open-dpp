import { z } from 'zod'
import { ReferenceJsonSchema } from './common/reference-json-schema'

export const SpecificAssetIdJsonSchema = z.object({
  name: z.string(),
  value: z.string(),
  semanticId: ReferenceJsonSchema.nullish(),
  supplementalSemanticIds: z.array(ReferenceJsonSchema).default([]),
  externalSubjectId: ReferenceJsonSchema.nullish(),
})
