import { z } from 'zod/v4';

export const ItemUpdateEventSchema = z.object({
  modelId: z.uuid(),
  templateId: z.uuid(),
  organizationId: z.uuid(),
  fieldValues: z.array(
    z.object({
      dataFieldId: z.uuid(),
      dataSectionId: z.uuid(),
      row: z.number(),
      value: z.unknown(),
    }),
  ),
  date: z.iso.datetime(),
});

export type ItemUpdateEventDto = z.infer<typeof ItemUpdateEventSchema>;
