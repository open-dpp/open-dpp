import { z } from 'zod'
import { ValueTypeSchema } from '../common/basic-json-schema'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema } from './submodel-base-json-schema'

export const RangeJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  valueType: ValueTypeSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  min: z.nullish(z.string()),
  max: z.nullish(z.string()),
})
