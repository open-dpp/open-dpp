import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { AssetAdministrationShellJsonSchema } from "../../domain/parsing/asset-administration-shell-json-schema";
import { PagingMetadataDtoSchema } from "./paging-metadata.dto";

export const AssetAdministrationShellResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: AssetAdministrationShellJsonSchema.array(),
});

export class AssetAdministrationShellResponseDto extends createZodDto(AssetAdministrationShellResponseDtoSchema) {}
