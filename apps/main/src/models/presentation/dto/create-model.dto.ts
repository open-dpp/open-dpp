import { z } from 'zod';

export const CreateModelDtoSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    templateId: z.string().optional(),
    marketplaceResourceId: z.string().optional(),
  })
  .refine((data) => !!data.templateId || !!data.marketplaceResourceId, {
    error: 'marketplaceResourceId or templateId must be provided',
  })
  .refine((data) => !(data.templateId && data.marketplaceResourceId), {
    error: 'marketplaceResourceId and templateId are mutually exclusive',
  });
export type CreateModelDto = z.infer<typeof CreateModelDtoSchema>;
