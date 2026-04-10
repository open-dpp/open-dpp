import { z } from "zod/v4";
import { AccessControlDbSchema } from "./access-control-db-schema";

export const SecurityDbSchema = z.object({
  localAccessControl: AccessControlDbSchema,
});

export type SecurityDb = z.infer<typeof SecurityDbSchema>;
