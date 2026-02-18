import { z } from 'zod'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema, SubmodelBaseModificationSchema } from './submodel-base-json-schema'
import { SubmodelElementModificationSchema } from './submodel-element-modification-schema'
import { SubmodelElementSchema } from './submodel-element-schema'

export const SubmodelElementCollectionJsonSchema = z.lazy(() =>
  SubmodelElementCollectionJsonSchemaImpl(),
).meta({ id: 'SubmodelElementCollection' })

export function SubmodelElementCollectionJsonSchemaImpl() {
  return z.object({
    ...SubmodelBaseJsonSchema.shape,
    extensions: ExtensionJsonSchema.array().default([]),
    value: SubmodelElementSchema.array().default([]),
  })
};

export type SubmodelElementCollectionRequestDto = z.input<typeof SubmodelElementCollectionJsonSchema>
export type SubmodelElementCollectionResponseDto = z.infer<typeof SubmodelElementCollectionJsonSchema>

export const SubmodelElementCollectionModificationSchema = z.object({
  ...SubmodelBaseModificationSchema.shape,
  value: SubmodelElementModificationSchema.array().optional(),
}).meta({ id: 'SubmodelElementCollectionModification' })

export type SubmodelElementCollectionModificationDto = z.infer<typeof SubmodelElementCollectionModificationSchema>
