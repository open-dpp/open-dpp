import { Sector } from "@open-dpp/api-client";
import { z } from "zod";

export const CreateTemplateDraftDtoSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  sectors: z.enum(Sector).array(),
});

export type CreateTemplateDraftDto = z.infer<
  typeof CreateTemplateDraftDtoSchema
>;
