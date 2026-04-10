import { z } from "zod/v4";
import { AccessPermissionRuleDbSchema } from "./access-permission-rule-db-schema";

export const AccessControlDbSchema = z.object({
  accessPermissionRules: AccessPermissionRuleDbSchema.array(),
});

export type AccessControlDb = z.infer<typeof AccessControlDbSchema>;
