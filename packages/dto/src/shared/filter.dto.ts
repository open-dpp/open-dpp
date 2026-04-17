import { z } from "zod";
import { DigitalProductDocumentStatusDtoEnum } from "./dpp.schemas";

export const FilterParamsDtoSchema = z.object({
  status: DigitalProductDocumentStatusDtoEnum.optional(),
});

export type FilterParamsDto = z.infer<typeof FilterParamsDtoSchema>;
