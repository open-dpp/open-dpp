import { z } from "zod";

export const UpdateSectionDraftDtoSchema = z.object({
  name: z.string().min(1),
});

export type UpdateSectionDraftDto = z.infer<typeof UpdateSectionDraftDtoSchema>;
