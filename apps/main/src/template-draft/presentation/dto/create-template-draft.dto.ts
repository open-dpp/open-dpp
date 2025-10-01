import { z } from 'zod';

import { Sector } from '../../../data-modelling/domain/sectors';

export const CreateTemplateDraftDtoSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  sectors: z.enum(Sector).array(),
});

export type CreateTemplateDraftDto = z.infer<
  typeof CreateTemplateDraftDtoSchema
>;
