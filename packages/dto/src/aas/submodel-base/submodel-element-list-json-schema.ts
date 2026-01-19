import { z } from 'zod'
import { ValueTypeSchema } from '../common/basic-json-schema'
import { ReferenceJsonSchema } from '../common/reference-json-schema'
import { AasSubmodelElementsEnum } from '../enums/aas-submodel-elements'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema } from './submodel-base-json-schema'
import { SubmodelElementSchema } from './submodel-element-schema'

export const SubmodelElementListJsonSchema = z.lazy(() =>
  SubmodelElementListJsonSchemaImpl(),
).meta({ id: 'SubmodelElementList' })

export function SubmodelElementListJsonSchemaImpl() {
  return z.object({
    ...SubmodelBaseJsonSchema.shape,
    typeValueListElement: AasSubmodelElementsEnum,
    extensions: ExtensionJsonSchema.array().default([]),
    orderRelevant: z.nullish(z.boolean()),
    semanticIdListElement: z.nullish(ReferenceJsonSchema),
    valueTypeListElement: z.nullish(ValueTypeSchema),
    value: SubmodelElementSchema.array().default([]),
  })
};
