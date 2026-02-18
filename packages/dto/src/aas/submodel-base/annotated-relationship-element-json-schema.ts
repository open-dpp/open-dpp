import { z } from 'zod'
import { ReferenceJsonSchema } from '../common/reference-json-schema'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema } from './submodel-base-json-schema'
import { SubmodelElementSchema } from './submodel-element-schema'

export const AnnotatedRelationshipElementJsonSchema = z.lazy(() =>
  AnnotatedRelationshipElementJsonSchemaImpl(),
).meta({ id: 'AnnotatedRelationshipElement' })

export function AnnotatedRelationshipElementJsonSchemaImpl() {
  return z.object({
    ...SubmodelBaseJsonSchema.shape,
    first: ReferenceJsonSchema,
    second: ReferenceJsonSchema,
    extensions: ExtensionJsonSchema.array().default([]),
    annotations: SubmodelElementSchema.array().default([]),
  })
};
