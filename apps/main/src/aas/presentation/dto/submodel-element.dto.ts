import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import {
  SubmodelBaseUnionSchema,
} from "../../domain/parsing/submodel-base/submodel-base-union-schema";
import { PagingMetadataDtoSchema } from "./paging-metadata.dto";

export const SubmodelElementPaginationResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: SubmodelBaseUnionSchema.array(),
}).meta({ id: "SubmodelElementPaginationResponseDto" });

export class SubmodelElementPaginationResponseDto extends createZodDto(SubmodelElementPaginationResponseDtoSchema) {}
