import { z } from 'zod'
import { ReferenceJsonSchema } from '../common/reference-json-schema'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema } from './submodel-base-json-schema'
import { SubmodelElementSchema } from './submodel-element-schema'

export const AnnotatedRelationshipElementJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  first: ReferenceJsonSchema,
  second: ReferenceJsonSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  annotations: SubmodelElementSchema.array().default([]),
}).meta({ id: 'AnnotatedRelationshipElement' })
