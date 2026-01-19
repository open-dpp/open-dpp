import type { z } from "zod";
import {
  BaseCreateModelDtoSchema,
} from "./create-model.dto";

export const UpdateModelDtoSchema = BaseCreateModelDtoSchema.partial();

export type UpdateModelDto = z.infer<typeof UpdateModelDtoSchema>;
