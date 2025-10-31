import { z } from "zod";
import { DataFieldType } from "../../../data-modelling/domain/data-field-base";

export const UpdateDataFieldDraftDtoSchema = z.object({
  name: z.string().min(1),
  type: z.enum(DataFieldType).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateDataFieldDraftDto = z.infer<
  typeof UpdateDataFieldDraftDtoSchema
>;
