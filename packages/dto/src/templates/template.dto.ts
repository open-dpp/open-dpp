import { z } from 'zod'
import { PagingMetadataDtoSchema } from '../paging-metadata.dto'
import { SharedDppDtoSchema } from '../shared/dpp.schemas'

export const TemplateDtoSchema = SharedDppDtoSchema

export type TemplateDto = z.infer<typeof TemplateDtoSchema>

export const TemplatePaginationDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: TemplateDtoSchema.array(),
}).meta({ id: 'Templates' })

export type TemplatePaginationDto = z.infer<typeof TemplatePaginationDtoSchema>
