import { z } from 'zod'
import { ReferenceJsonSchema, ReferenceModificationSchema } from '../common/reference-json-schema'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema, SubmodelBaseModificationSchema } from './submodel-base-json-schema'

export const ReferenceElementJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  extensions: ExtensionJsonSchema.array().default([]),
  value: z.nullish(ReferenceJsonSchema),
})

export const ReferenceElementModificationSchema = z.object({
  ...SubmodelBaseModificationSchema.shape,
  value: z.nullish(ReferenceModificationSchema),
})

export type ReferenceElementResponseDto = z.infer<typeof ReferenceElementJsonSchema>
export type ReferenceElementRequestDto = z.input<typeof ReferenceElementJsonSchema>
export type ReferenceElementModificationDto = z.input<typeof ReferenceElementModificationSchema>
