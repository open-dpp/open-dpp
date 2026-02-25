import { z } from 'zod'
import { PagingMetadataDtoSchema } from '../shared/pagination.dto'
import { AdministrativeInformationJsonSchema } from './administrative-information-json-schema'
import { AssetInformationJsonSchema } from './asset-information-json-schema'
import { NameAndDescriptionModificationSchema } from './common/basic-json-schema'
import { LanguageTextJsonSchema } from './common/language-text-json-schema'
import { ReferenceJsonSchema } from './common/reference-json-schema'
import { EmbeddedDataSpecificationJsonSchema } from './embedded-data-specification-json-schema'
import { ExtensionJsonSchema } from './extension-json-schema'
import { ResourceJsonSchema } from './resource-json-schema'

export const AssetAdministrationShellJsonSchema = z.object({
  id: z.string().meta({ description: 'Id of the AAS' }),
  assetInformation: AssetInformationJsonSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  category: z.nullish(z.string()),
  idShort: z.nullish(z.string()),
  displayName: LanguageTextJsonSchema.array().default([]),
  description: LanguageTextJsonSchema.array().default([]),
  administration: z.nullish(AdministrativeInformationJsonSchema),
  embeddedDataSpecifications: EmbeddedDataSpecificationJsonSchema.array().default([]),
  derivedFrom: z.nullish(ResourceJsonSchema),
  submodels: ReferenceJsonSchema.array().default([]),
})
export const AssetAdministrationShellPaginationResponseDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: AssetAdministrationShellJsonSchema.array(),
  })
  .meta({ id: 'AssetAdministrationShells' })
export type AssetAdministrationShellPaginationResponseDto = z.infer<
  typeof AssetAdministrationShellPaginationResponseDtoSchema
>
export const AssetAdministrationShellCreateDtoSchema = AssetAdministrationShellJsonSchema.partial()
export type AssetAdministrationShellCreateDto = z.input<typeof AssetAdministrationShellCreateDtoSchema>
export type AssetAdministrationShellResponseDto = z.infer<typeof AssetAdministrationShellJsonSchema>

export type AssetAdministrationShellRequestDto = z.input<typeof AssetAdministrationShellJsonSchema>

export const AssetAdministrationShellModificationSchema = NameAndDescriptionModificationSchema

export type AssetAdministrationShellModificationDto = z.infer<
  typeof AssetAdministrationShellModificationSchema
>
