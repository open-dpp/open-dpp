import { PopulateSchema } from "./populate.dto";
import { PagingParamsDtoSchema } from "./pagination.dto";
import { z } from "zod";
import { FilterParamsDtoSchema, PassportFilterParamsDtoSchema } from "./filter.dto";

export const GetAllParamsDtoSchema = z.object({
  pagination: PagingParamsDtoSchema.optional(),
  populate: PopulateSchema.optional(),
  filter: FilterParamsDtoSchema.optional(),
});

export type GetAllParamsDto = z.infer<typeof GetAllParamsDtoSchema>;

export const GetAllPassportsParamsDtoSchema = GetAllParamsDtoSchema.extend({
  filter: PassportFilterParamsDtoSchema.optional(),
});

export type GetAllPassportsParamsDto = z.infer<typeof GetAllPassportsParamsDtoSchema>;
