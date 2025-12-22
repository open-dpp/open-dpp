import { z } from 'zod'

export const ReferenceTypes = {
  ExternalReference: 'ExternalReference',
  ModelReference: 'ModelReference',
} as const
export const ReferenceTypesEnum = z.enum(ReferenceTypes)
export type ReferenceTypesType = z.infer<typeof ReferenceTypesEnum>
