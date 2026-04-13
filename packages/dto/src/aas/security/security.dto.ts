import { z } from "zod";
import {
  AccessPermissionRuleDtoSchema,
  SubjectAttributesDtoSchema,
} from "./access-permission-rule.dto";

export const AccessControlDtoSchema = z.object({
  accessPermissionRules: AccessPermissionRuleDtoSchema.array(),
});
export const SecurityDtoSchema = z.object({
  localAccessControl: AccessControlDtoSchema,
});

export type SecurityResponseDto = z.infer<typeof SecurityDtoSchema>;

export const DeletePolicyDtoSchema = z.object({
  subject: SubjectAttributesDtoSchema,
  object: z.string(),
});

export type DeletePolicyDto = z.infer<typeof DeletePolicyDtoSchema>;
