import { z } from "zod";
import { DigitalProductDocumentStatusDtoEnum } from "./digital-product-document.schemas";

// `status` matches a single value; `statuses` matches any of several ("Draft OR Published").
// Callers should pass at most one of the two — the repository layer treats `statuses`
// as taking precedence when both are set.
export const FilterParamsDtoSchema = z.object({
  status: DigitalProductDocumentStatusDtoEnum.optional(),
  statuses: z.array(DigitalProductDocumentStatusDtoEnum).nonempty().optional(),
});

export type FilterParamsDto = z.infer<typeof FilterParamsDtoSchema>;
