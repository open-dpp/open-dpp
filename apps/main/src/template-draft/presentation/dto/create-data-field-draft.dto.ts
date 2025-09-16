import { DataFieldType } from '../../../data-modelling/domain/data-field-base';
import { GranularityLevel } from '../../../data-modelling/domain/granularity-level';
import { z } from 'zod';

export const CreateDataFieldDraftSchema = z.object({
  name: z.string().min(1),
  type: z.enum(DataFieldType),
  options: z.record(z.string(), z.unknown()).optional(),
  granularityLevel: z.enum(GranularityLevel),
});

export type CreateDataFieldDraftDto = z.infer<
  typeof CreateDataFieldDraftSchema
>;
