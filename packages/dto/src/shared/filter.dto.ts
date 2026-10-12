import { z } from "zod";
import { PeriodDtoSchema } from "./time.dto";
import { DigitalProductDocumentStatusDtoEnum } from "../digital-product-document/digital-product-document.schemas";

export const FilterParamsDtoSchema = z
  .object({
    status: DigitalProductDocumentStatusDtoEnum.array().optional(),
  })
  .extend(PeriodDtoSchema.shape);

export type FilterParamsDto = z.infer<typeof FilterParamsDtoSchema>;

// Passport-only filters: templates have no template ids of their own.
export const PassportFilterParamsDtoSchema = FilterParamsDtoSchema.extend({
  templateIds: z.string().min(1).array().optional(),
});

export type PassportFilterParamsDto = z.infer<typeof PassportFilterParamsDtoSchema>;

// Body of the EU registry export: the passport filters without status (only Published are exported).
export const PassportRegistryExportRequestDtoSchema = PassportFilterParamsDtoSchema.omit({
  status: true,
});

export type PassportRegistryExportRequestDto = z.infer<
  typeof PassportRegistryExportRequestDtoSchema
>;
