import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { PagingMetadataDtoSchema } from '../../shared/pagination.dto'
import { SubmodelJsonSchema } from '../submodel-base/submodel-json-schema'
import { SubmodelBaseModificationSchema } from './submodel-base.dto'

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
  id: z.string().default(() => uuidv4()),
})

export const SubmodelModificationSchema = SubmodelBaseModificationSchema

export type SubmodelModificationDto = z.infer<typeof SubmodelModificationSchema>

export type SubmodelRequestDto = z.input<typeof SubmodelRequestDtoSchema>
export type SubmodelResponseDto = z.infer<typeof SubmodelJsonSchema>
