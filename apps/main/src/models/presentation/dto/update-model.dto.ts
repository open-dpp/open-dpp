import { CreateModelDtoSchema } from './create-model.dto';
import { z } from 'zod';

export const UpdateModelDtoSchema = CreateModelDtoSchema.partial();

export type UpdateModelDto = z.infer<typeof UpdateModelDtoSchema>;
