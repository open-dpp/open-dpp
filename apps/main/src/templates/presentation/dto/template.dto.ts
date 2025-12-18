import { EnvironmentJsonSchema } from "@open-dpp/aas";
import { z } from "zod";

export const TemplateDtoSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  environment: EnvironmentJsonSchema,
});

export type TemplateDto = z.infer<typeof TemplateDtoSchema>;
