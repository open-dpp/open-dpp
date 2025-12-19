import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { SubmodelJsonSchema } from '../submodel-base/submodel-json-schema'
import { PagingMetadataDtoSchema } from './paging-metadata.dto'

export const SubmodelPaginationResponseDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: SubmodelJsonSchema.array(),
  })
  .meta({ id: 'Submodels' })

export type SubmodelPaginationResponseDto = z.infer<
  typeof SubmodelPaginationResponseDtoSchema
>

export const SubmodelRequestDtoSchema = SubmodelJsonSchema.extend({
  id: z.string().default(randomUUID()),
})

export type SubmodelRequestDto = z.infer<typeof SubmodelRequestDtoSchema>
export type SubmodelResponseDto = z.infer<typeof SubmodelJsonSchema>
