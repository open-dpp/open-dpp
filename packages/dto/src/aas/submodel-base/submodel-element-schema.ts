import { z } from 'zod'
import { PagingMetadataDtoSchema } from '../../shared/pagination.dto'
import { SubmodelBaseJsonSchema, SubmodelBaseModificationSchema } from './submodel-base-json-schema'

export const SubmodelElementSchema = z.looseObject({
  ...SubmodelBaseJsonSchema.shape,
  modelType: z.string(),
}).meta({ id: 'SubmodelElement' })

export const SubmodelElementPaginationResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: SubmodelElementSchema.array(),
}).meta({ id: 'SubmodelElements' })

export type SubmodelElementPaginationResponseDto = z.infer<typeof SubmodelElementPaginationResponseDtoSchema>
export type SubmodelElementRequestDto = z.infer<typeof SubmodelElementSchema>
export type SubmodelElementResponseDto = z.infer<typeof SubmodelElementSchema>

export const SubmodelElementModificationSchema = z.looseObject({
  ...SubmodelBaseModificationSchema.shape,
})

export type SubmodelElementModificationDto = z.infer<typeof SubmodelElementModificationSchema>
