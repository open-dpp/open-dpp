import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { SubmodelJsonSchema } from "../../domain/parsing/submodel-base/submodel-json-schema";
import { PagingMetadataDtoSchema } from "./paging-metadata.dto";

export const SubmodelPaginationResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: SubmodelJsonSchema.array(),
});

export class SubmodelPaginationResponseDto extends createZodDto(SubmodelPaginationResponseDtoSchema) {}
export class SubmodelResponseDto extends createZodDto(SubmodelJsonSchema) {}
