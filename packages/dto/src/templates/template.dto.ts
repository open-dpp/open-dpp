import { z } from 'zod'
import { AssetAdministrationShellCreateDtoSchema } from '../aas/asset-administration-shell-json-schema'
import { SharedDppDtoSchema } from '../shared/dpp.schemas'
import { PagingMetadataDtoSchema } from '../shared/pagination.dto'

export const TemplateDtoSchema = SharedDppDtoSchema

export type TemplateDto = z.infer<typeof TemplateDtoSchema>

export const TemplatePaginationDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: TemplateDtoSchema.array(),
}).meta({ id: 'Templates' })

export type TemplatePaginationDto = z.infer<typeof TemplatePaginationDtoSchema>

export const TemplateCreateDtoSchema = z.object({
  environment: z.object({
    assetAdministrationShells: AssetAdministrationShellCreateDtoSchema.array().max(1),
  }),
})
export type TemplateCreateDto = z.input<typeof TemplateCreateDtoSchema>
