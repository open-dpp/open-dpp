import { z } from 'zod'
import { AccessPermissionRuleDtoSchema } from './access-permission-rule.dto'

export const MemberRoleDto = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const

export const MemberRoleDtoEnum = z.enum(MemberRoleDto)

export const AccessControlDtoSchema = z.object({
  accessPermissionRules: AccessPermissionRuleDtoSchema.array(),
})
export const SecurityDtoSchema = z.object({
  localAccessControl: AccessControlDtoSchema,
})

export type SecurityResponseDto = z.infer<typeof SecurityDtoSchema>
