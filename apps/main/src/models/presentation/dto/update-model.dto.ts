import type { z } from "zod";
import {
  BaseCreateModelDtoSchema,
} from "./create-model.dto";

export const UpdateModelDtoSchema = BaseCreateModelDtoSchema.partial().refine(
  data => !(data.templateId && data.marketplaceResourceId),
  {
    error: "marketplaceResourceId and templateId are mutually exclusive",
  },
);

export type UpdateModelDto = z.infer<typeof UpdateModelDtoSchema>;
