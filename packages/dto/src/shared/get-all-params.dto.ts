import { PopulateSchema } from "./populate.dto";
import { PagingParamsDtoSchema } from "./pagination.dto";
import { z } from "zod";
import { FilterParamsDtoSchema } from "./filter.dto";

export const GetAllParamsDtoSchema = z.object({
  pagination: PagingParamsDtoSchema.optional(),
  populate: PopulateSchema.optional(),
  filter: FilterParamsDtoSchema.optional(),
});

export type GetAllParamsDto = z.infer<typeof GetAllParamsDtoSchema>;
