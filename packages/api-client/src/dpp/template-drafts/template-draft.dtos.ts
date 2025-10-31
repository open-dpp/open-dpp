import type { Sector } from '../../marketplace/passport-templates/passport-templates.dtos'
import type { DataFieldType } from '../data-modelling/data-field.dto'
import type { GranularityLevel } from '../data-modelling/granularity-level'
import type { SectionDto, SectionType } from '../data-modelling/section.dto'

export interface PublicationDto {
  id: string
  version: string
}

export enum VisibilityLevel {
  PRIVATE = 'Private',
  PUBLIC = 'Public',
}

export interface PublicationCreateDto {
  visibility: VisibilityLevel
  sectors?: Sector[]
}

export interface TemplateDraftDto {
  id: string
  name: string
  description: string
  sectors: Sector[]
  version: string
  publications: PublicationDto[]
  sections: SectionDto[]
  createdByUserId: string
  ownedByOrganizationId: string
}

export interface TemplateDraftGetAllDto {
  id: string
  name: string
}

// Create dtos

export interface DataFieldDraftCreateDto {
  type: DataFieldType
  name: string
  options?: Record<string, unknown>
  granularityLevel: GranularityLevel
}

export interface SectionDraftCreateDto {
  name: string
  type: SectionType
  parentSectionId?: string
  granularityLevel?: GranularityLevel
}

export interface TemplateDraftCreateDto {
  name: string
  description: string
  sectors: Sector[]
}

// Update dtos

export interface DataFieldDraftUpdateDto {
  name: string
  type?: DataFieldType
  options?: Record<string, unknown>
}

export interface SectionDraftUpdateDto {
  name: string
}

export interface TemplateDraftUpdateDto {
  name: string
  description: string
  sectors: Sector[]
}

export enum MoveType {
  POSITION = 'Position',
}

export enum MoveDirection {
  UP = 'up',
  DOWN = 'down',
}

export interface MoveDto {
  type: MoveType
  direction: MoveDirection
}
