import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { SubmodelJsonSchema } from "../../domain/parsing/submodel-base/submodel-json-schema";
import { PagingMetadataDtoSchema } from "./paging-metadata.dto";

export const SubmodelResponseDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: SubmodelJsonSchema.array(),
});

export class SubmodelResponseDto extends createZodDto(SubmodelResponseDtoSchema) {}
