import { z } from 'zod'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema } from './submodel-base-json-schema'
import { SubmodelElementSchema } from './submodel-element-schema'

export const SubmodelElementCollectionJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  extensions: ExtensionJsonSchema.array().default([]),
  value: SubmodelElementSchema.array().default([]),
})
