import { z } from 'zod'

export const StatusDtoSchema = z.object({
  version: z.string(),
})

export type StatusDto = z.infer<typeof StatusDtoSchema>
