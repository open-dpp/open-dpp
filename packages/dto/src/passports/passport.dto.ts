import { z } from 'zod'
import { AssetAdministrationShellCreateDtoSchema } from '../aas/asset-administration-shell-json-schema'
import { SharedDppDtoSchema } from '../shared/dpp.schemas'
import { PagingMetadataDtoSchema } from '../shared/pagination.dto'

export const PassportDtoSchema = SharedDppDtoSchema.extend({
  templateId: z.string().nullable(),
  /** UPI uuid for presentation/chat links; set when listing passports */
  uniqueProductIdentifierUuid: z.uuid().optional(),
})

export type PassportDto = z.infer<typeof PassportDtoSchema>

export const PassportPaginationDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: PassportDtoSchema.array(),
}).meta({ id: 'Passports' })

export type PassportPaginationDto = z.infer<typeof PassportPaginationDtoSchema>

export const PassportRequestCreateDtoSchema = z.union([
  z.object({
    templateId: z.string(),
  }),
  AssetAdministrationShellCreateDtoSchema,
])

export type PassportRequestCreateDto = z.infer<typeof PassportRequestCreateDtoSchema>
