import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { PagingMetadataDtoSchema } from '../../shared/pagination.dto'
import { AdministrativeInformationJsonSchema } from '../administrative-information-json-schema'
import { ModellingKindEnum } from '../enums/modelling-kind-enum'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema, SubmodelBaseModificationSchema } from './submodel-base-json-schema'
import { SubmodelElementSchema } from './submodel-element-schema'

export const SubmodelJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  id: z.string(),
  extensions: ExtensionJsonSchema.array().default([]),
  administration: z.nullish(AdministrativeInformationJsonSchema),
  kind: z.nullish(ModellingKindEnum),
  submodelElements: SubmodelElementSchema.array().default([]),
}).meta({ id: 'Submodel' })
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
