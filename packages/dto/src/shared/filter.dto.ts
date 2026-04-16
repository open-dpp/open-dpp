import { z } from "zod";
import { DppStatusDtoEnum } from "./dpp.schemas";

export const FilterParamsDtoSchema = z.object({
  status: DppStatusDtoEnum.optional(),
});

export type FilterParamsDto = z.infer<typeof FilterParamsDtoSchema>;
