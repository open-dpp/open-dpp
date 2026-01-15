import { z } from 'zod'

export const PagingMetadataDtoSchema = z.object({
  paging_metadata: z.object({
    cursor: z.string().nullable(),
  }),
})

export const PagingParamsDtoSchema = z.object({
  limit: z.number().optional(),
  cursor: z.string().optional(),
})

export type PagingParamsDto = z.infer<typeof PagingParamsDtoSchema>
export type PagingMetadataDto = z.infer<typeof PagingMetadataDtoSchema>
