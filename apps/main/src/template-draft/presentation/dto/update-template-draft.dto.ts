import { z } from 'zod';
import { Sector } from '@open-dpp/api-client';

export const UpdateTemplateDraftDtoSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  sectors: z.enum(Sector).array(),
});

export type UpdateTemplateDraftDto = z.infer<
  typeof UpdateTemplateDraftDtoSchema
>;
