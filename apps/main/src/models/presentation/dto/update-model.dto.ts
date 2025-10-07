import type { z } from "zod";
import { CreateModelDtoSchema } from "./create-model.dto";

export const UpdateModelDtoSchema = CreateModelDtoSchema.partial();

export type UpdateModelDto = z.infer<typeof UpdateModelDtoSchema>;
