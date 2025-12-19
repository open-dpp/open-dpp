import { z } from 'zod'
import { ValueTypeSchema } from './common/basic-json-schema'
import { ReferenceJsonSchema } from './common/reference-json-schema'

export const ExtensionJsonSchema = z.object({
  name: z.string(),
  semanticId: z.nullish(ReferenceJsonSchema),
  supplementalSemanticIds: z.array(ReferenceJsonSchema).default([]),
  valueType: z.nullish(ValueTypeSchema),
  value: z.nullish(z.string()),
  refersTo: z.array(ReferenceJsonSchema).default([]),
})
