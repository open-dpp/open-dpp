import { z } from 'zod'

export const VisibilityLevel = {
  PRIVATE: 'Private',
  PUBLIC: 'Public',
} as const

export type VisibilityLevel_TYPE = (typeof VisibilityLevel)[keyof typeof VisibilityLevel]

export const PublishDtoSchema = z.object({
  visibility: z.enum(VisibilityLevel),
})

export type PublishDto = z.infer<typeof PublishDtoSchema>
