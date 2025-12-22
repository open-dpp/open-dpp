import { z } from 'zod'
import { PagingMetadataDtoSchema } from '../../paging-metadata.dto'
import {
  SubmodelElementSchema,
} from '../submodel-base/submodel-element-schema'

export const SubmodelBaseUnionDtoSchema = SubmodelElementSchema.meta({ id: 'SubmodelElement' })

export const SubmodelElementPaginationResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: SubmodelBaseUnionDtoSchema.array(),
}).meta({ id: 'SubmodelElements' })

export type SubmodelElementPaginationResponseDto = z.infer<typeof SubmodelElementPaginationResponseDtoSchema>
export type SubmodelElementRequestDto = z.infer<typeof SubmodelBaseUnionDtoSchema>
export type SubmodelElementResponseDto = z.infer<typeof SubmodelBaseUnionDtoSchema>
