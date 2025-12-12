import { z } from "zod";
import {
  SubmodelBaseResponseUnionSchema,
} from "../../domain/parsing/submodel-base/submodel-base-union-schema";
import { PagingMetadataDtoSchema } from "./paging-metadata.dto";

export const SubmodelElementPaginationResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: SubmodelBaseResponseUnionSchema.array(),
}).meta({ id: "SubmodelElements" });

export type SubmodelElementPaginationResponseDto = z.infer<typeof SubmodelElementPaginationResponseDtoSchema>;
export type SubmodelElementResponseDto = z.infer<typeof SubmodelBaseResponseUnionSchema>;
