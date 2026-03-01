import { z } from 'zod'

export const TableModificationParamsDtoSchema = z.object({
  position: z.number().optional(),
})

export type TableModificationParamsDto = z.infer<typeof TableModificationParamsDtoSchema>
