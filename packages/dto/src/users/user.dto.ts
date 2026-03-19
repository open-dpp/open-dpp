import { z } from 'zod'

export interface UserDto {
  id: string
  email: string
  name?: string
  image?: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export const UserRoleDto = {
  ADMIN: 'admin', // That is the super admin over all organizations
  USER: 'user',
  ANONYMOUS: 'anonymous',
} as const

export const UserRoleDtoEnum = z.enum(UserRoleDto)
export type UserRoleDtoType = z.infer<typeof UserRoleDtoEnum>

export const MemberRoleDto = {
  OWNER: 'owner',
  MEMBER: 'member',
} as const

export const MemberRoleDtoEnum = z.enum(MemberRoleDto)
export type MemberRoleDtoType = z.infer<typeof MemberRoleDtoEnum>
