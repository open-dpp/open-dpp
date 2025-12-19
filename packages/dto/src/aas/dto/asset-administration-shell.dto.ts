import { z } from 'zod'
import { AssetAdministrationShellJsonSchema } from '../asset-administration-shell-json-schema'
import { PagingMetadataDtoSchema } from './paging-metadata.dto'

export const AssetAdministrationShellPaginationResponseDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: AssetAdministrationShellJsonSchema.array(),
  })
  .meta({ id: 'AssetAdministrationShells' })

export type AssetAdministrationShellPaginationResponseDto = z.infer<
  typeof AssetAdministrationShellPaginationResponseDtoSchema
>
