import { z } from 'zod'
import { ReferenceJsonSchema } from '../common/reference-json-schema'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema } from './submodel-base-json-schema'

export const ReferenceElementJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  extensions: ExtensionJsonSchema.array().default([]),
  value: z.nullish(ReferenceJsonSchema),
})

export type ReferenceElementResponseDto = z.infer<typeof ReferenceElementJsonSchema>
export type ReferenceElementRequestDto = z.input<typeof ReferenceElementJsonSchema>
