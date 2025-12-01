import type { SectionDto } from '../data-modelling/section.dto'

export interface DataSectionDto extends SectionDto {
  dataValues: Record<string, unknown>[]
}

export interface ProductPassportDto {
  id: string
  name: string
  description: string
  mediaReferences: string[]
  dataSections: DataSectionDto[]
  organizationName: string
  organizationImage: string
}
