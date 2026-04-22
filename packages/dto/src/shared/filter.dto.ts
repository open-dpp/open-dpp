import { z } from "zod";
import { DigitalProductDocumentStatusDtoEnum } from "./digital-product-document.schemas";

export const FilterParamsDtoSchema = z.object({
  status: DigitalProductDocumentStatusDtoEnum.array().optional(),
});

export type FilterParamsDto = z.infer<typeof FilterParamsDtoSchema>;
