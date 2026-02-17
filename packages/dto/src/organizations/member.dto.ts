import type { UserDto } from '../users/user.dto'

export interface MemberDto {
  id: string
  organizationId: string
  userId: string
  role: string
  createdAt: Date
  updatedAt: Date
  user?: UserDto
}
