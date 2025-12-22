import type { Sector } from '../../marketplace/passport-templates/passport-templates.dtos'
import type { SectionDto } from '../data-modelling/section.dto'

export interface TemplateGetAllDto {
  id: string
  name: string
  version: string
  description: string
  sectors: Sector[]
}

export interface TemplateDto {
  id: string
  name: string
  version: string
  sections: SectionDto[]
  createdByUserId: string
  ownedByOrganizationId: string
}
