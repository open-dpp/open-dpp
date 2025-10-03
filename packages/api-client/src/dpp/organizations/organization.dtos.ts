import type { UserDto } from '../users/user.dtos'

export interface OrganizationDto {
  id: string
  name: string
  members: Array<UserDto>
  createdByUserId: string
  ownedByUserId: string
}

export interface OrganizationCreateDto {
  name: string
}
