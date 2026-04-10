import { z } from "zod/v4";
import { PermissionPerObjectDbSchema } from "./permissions-per-object-db-schema";
import { SubjectAttributesDbSchema } from "./subject-attributes-db-schema";

export const AccessPermissionRuleDbSchema = z.object({
  targetSubjectAttributes: SubjectAttributesDbSchema,
  permissionsPerObject: z.array(PermissionPerObjectDbSchema),
});
