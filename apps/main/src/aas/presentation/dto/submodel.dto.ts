import { z } from "zod";
import { SubmodelJsonSchema } from "../../domain/parsing/submodel-base/submodel-json-schema";
import { PagingMetadataDtoSchema } from "./paging-metadata.dto";

export const SubmodelPaginationResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: SubmodelJsonSchema.array(),
}).meta({ id: "Submodels" });

export type SubmodelPaginationResponseDto = z.infer<typeof SubmodelPaginationResponseDtoSchema>;
export type SubmodelResponseDto = z.infer<typeof SubmodelJsonSchema>;
