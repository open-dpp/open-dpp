import type { GranularityLevel } from '../data-modelling/granularity-level'

export interface UniqueProductIdentifierDto {
  uuid: string
  referenceId: string
}

export interface UniqueProductIdentifierReferenceDto {
  id: string
  organizationId: string
  modelId?: string
  granularityLevel: GranularityLevel
}

export interface UniqueProductIdentifierMetadataDto {
  passportId: string
  modelId: string
  templateId: string
  organizationId: string
}
