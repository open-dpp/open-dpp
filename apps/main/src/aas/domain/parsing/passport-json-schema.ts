import { z } from "zod";
import { EnvironmentJsonSchema } from "./environment-json-schema";

export const PassportJsonSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  environment: EnvironmentJsonSchema,
});
