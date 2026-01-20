import { z } from 'zod'
import { ValueTypeSchema } from '../common/basic-json-schema'
import { ReferenceJsonSchema } from '../common/reference-json-schema'
import { AasSubmodelElementsEnum } from '../enums/aas-submodel-elements'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema, SubmodelBaseModificationSchema } from './submodel-base-json-schema'
import { SubmodelElementModificationSchema } from './submodel-element-modification-schema'
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

export type SubmodelElementListRequestDto = z.input<typeof SubmodelElementListJsonSchema>
export type SubmodelElementListResponseDto = z.infer<typeof SubmodelElementListJsonSchema>

export const SubmodelElementListModificationSchema = z.object({
  ...SubmodelBaseModificationSchema.shape,
  value: SubmodelElementModificationSchema.array().optional(),
}).meta({ id: 'SubmodelElementListModification' })

export type SubmodelElementListModificationDto = z.input<typeof SubmodelElementListModificationSchema>
