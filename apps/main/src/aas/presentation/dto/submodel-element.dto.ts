import { z } from "zod";
import {
  SubmodelBaseUnionSchema,
} from "../../domain/parsing/submodel-base/submodel-base-union-schema";
import { PagingMetadataDtoSchema } from "./paging-metadata.dto";

export const SubmodelElementPaginationResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: SubmodelBaseUnionSchema.array(),
}).meta({ id: "SubmodelElements" });

export type SubmodelElementPaginationResponseDto = z.infer<typeof SubmodelElementPaginationResponseDtoSchema>;
