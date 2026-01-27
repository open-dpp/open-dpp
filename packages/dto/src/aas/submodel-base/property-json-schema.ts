import { z } from 'zod'
import { ValueTypeSchema } from '../common/basic-json-schema'
import { ReferenceJsonSchema } from '../common/reference-json-schema'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema, SubmodelBaseModificationSchema } from './submodel-base-json-schema'

export const PropertyJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  valueType: ValueTypeSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  value: z.nullish(z.string()),
  valueId: z.nullish(ReferenceJsonSchema),
})

export const PropertyModificationSchema = z.object({
  ...SubmodelBaseModificationSchema.shape,
  value: z.nullish(z.string()),
})

export type PropertyResponseDto = z.infer<typeof PropertyJsonSchema>
export type PropertyRequestDto = z.input<typeof PropertyJsonSchema>
export type PropertyModificationDto = z.input<typeof PropertyModificationSchema>
