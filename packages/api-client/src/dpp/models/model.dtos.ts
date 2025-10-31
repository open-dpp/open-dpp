import type { ProductPassportDataDto } from '../passport-data/data-value.dto'

export interface ModelDto extends ProductPassportDataDto {
  name: string
  mediaReferences: string[]
  description?: string
  owner: string
}

export interface ModelCreateDto {
  name: string
  description?: string
  templateId?: string
  marketplaceResourceId?: string
}

export interface MediaReferenceDto {
  id: string
}
