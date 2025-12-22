import { z } from 'zod'

export const ModellingKind = {
  Template: 'Template',
  Instance: 'Instance',
} as const
export const ModellingKindEnum = z.enum(ModellingKind)
export type ModellingKindType = z.infer<typeof ModellingKindEnum>
