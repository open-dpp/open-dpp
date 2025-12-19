import { z } from 'zod'
import { EntityTypeEnum } from '../enums/entity-type-enum'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SpecificAssetIdJsonSchema } from '../specific-asset-id-json-schema'
import { SubmodelBaseJsonSchema } from './submodel-base-json-schema'
import { SubmodelElementSchema } from './submodel-element-schema'

export const EntityTypeJsonSchema = z.lazy(() =>
  EntityTypeJsonSchemaImpl(),
)

export function EntityTypeJsonSchemaImpl() {
  return z.object({
    ...SubmodelBaseJsonSchema.shape,
    entityType: EntityTypeEnum,
    extensions: ExtensionJsonSchema.array().default([]),
    statements: SubmodelElementSchema.array().default([]),
    globalAssetId: z.nullish(z.string()),
    specificAssetIds: SpecificAssetIdJsonSchema.array().default([]),
  },
  )
}
