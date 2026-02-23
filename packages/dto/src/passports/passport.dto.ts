import { z } from 'zod'
import { SharedDppDtoSchema } from '../shared/dpp.schemas'
import { PagingMetadataDtoSchema } from '../shared/pagination.dto'

export const PassportDtoSchema = SharedDppDtoSchema.extend({
  templateId: z.string().nullable(),
  /** UPI uuid for presentation/chat links; set when listing passports */
  uniqueProductIdentifierUuid: z.string().uuid().optional(),
})

export type PassportDto = z.infer<typeof PassportDtoSchema>

export const PassportPaginationDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: PassportDtoSchema.array(),
}).meta({ id: 'Passports' })

export type PassportPaginationDto = z.infer<typeof PassportPaginationDtoSchema>

export const PassportRequestCreateDtoSchema = z.object({
  templateId: z.string().optional(),
}).optional()

export type PassportRequestCreateDto = z.infer<typeof PassportRequestCreateDtoSchema>
