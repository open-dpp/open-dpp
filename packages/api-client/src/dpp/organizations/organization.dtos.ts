export interface OrganizationDto {
  id: string
  name: string
  slug: string
  logo?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationCreateDto {
  name: string
  slug: string
  logo?: string
  metadata?: any
}
