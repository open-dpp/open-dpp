import { AssetAdministrationShellJsonSchema } from "@open-dpp/aas";
import { z } from "zod";
import { PagingMetadataDtoSchema } from "./paging-metadata.dto";

export const AssetAdministrationShellPaginationResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: AssetAdministrationShellJsonSchema.array(),
}).meta({ id: "AssetAdministrationShells" });

export type AssetAdministrationShellResponseDto = z.infer<typeof AssetAdministrationShellPaginationResponseDtoSchema>;
