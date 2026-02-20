import type { KeyTypesType } from '../enums/key-types-enum'
import type { ReferenceTypesType } from '../enums/reference-types-enum'
import { z } from 'zod'
import { ReferenceTypesEnum } from '../enums/reference-types-enum'
import { KeyJsonSchema, KeyModificationSchema } from './key-json-schema'

export const ReferenceJsonSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: ReferenceTypesEnum,
    referredSemanticId: ReferenceJsonSchema.nullish(),
    keys: z.array(KeyJsonSchema),
  }),
)

export interface ReferenceModification {
  type?: ReferenceTypesType
  referredSemanticId?: ReferenceModification | null
  keys?: { type: KeyTypesType, value: string }[]
}

export const ReferenceModificationSchema: z.ZodType<ReferenceModification> = z.lazy(() =>
  z.object({
    type: ReferenceTypesEnum.optional(),
    referredSemanticId: ReferenceJsonSchema.nullish(),
    keys: z.array(KeyModificationSchema).optional(),
  }),
)
