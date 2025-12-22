import { z } from 'zod'

export const PagingMetadataDtoSchema = z.object({
  paging_metadata: z.object({
    cursor: z.string().nullable(),
  }),
})
