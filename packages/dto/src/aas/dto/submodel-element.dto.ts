import { z } from 'zod'
import { PagingMetadataDtoSchema } from '../../shared/pagination.dto'
import {
  SubmodelElementSchema,
} from '../submodel-base/submodel-element-schema'

export const SubmodelElementPaginationResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: SubmodelElementSchema.array(),
}).meta({ id: 'SubmodelElements' })

export type SubmodelElementPaginationResponseDto = z.infer<typeof SubmodelElementPaginationResponseDtoSchema>
export type SubmodelElementRequestDto = z.infer<typeof SubmodelElementSchema>
export type SubmodelElementResponseDto = z.infer<typeof SubmodelElementSchema>
