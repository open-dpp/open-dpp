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

export const ReferenceModificationSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: ReferenceTypesEnum.optional(),
    referredSemanticId: ReferenceJsonSchema.nullish(),
    keys: z.array(KeyModificationSchema).optional(),
  }),
)
