import { z } from 'zod'
import { QualifierKindEnum } from '../enums/qualifier-kind-enum'
import { ValueTypeSchema } from './basic-json-schema'
import { ReferenceJsonSchema } from './reference-json-schema'

export const QualifierJsonSchema = z.object({
  type: z.string(),
  valueType: ValueTypeSchema,
  semanticId: ReferenceJsonSchema.nullish(),
  supplementalSemanticIds: z.array(ReferenceJsonSchema).default([]),
  kind: QualifierKindEnum,
  value: z.string().nullish(),
  valueId: ReferenceJsonSchema.nullish(),
})
