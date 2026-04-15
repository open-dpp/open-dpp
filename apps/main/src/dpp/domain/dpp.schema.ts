import { DateTimeSchema, EnvironmentJsonSchema, ExtendedEnvironmentJsonSchema } from "@open-dpp/dto";
import { z } from "zod";
import { DppStatusChangeSchema } from "./dpp-status";

export const SharedDppSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  environment: z.union([EnvironmentJsonSchema, ExtendedEnvironmentJsonSchema]),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  lastStatusChange: DppStatusChangeSchema,
});
