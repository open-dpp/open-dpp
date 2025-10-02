import { z } from 'zod'

export const UpdateDataFieldDraftDtoSchema = z.object({
  name: z.string().min(1),
  options: z.record(z.string(), z.unknown()).optional(),
})

export type UpdateDataFieldDraftDto = z.infer<
  typeof UpdateDataFieldDraftDtoSchema
>
