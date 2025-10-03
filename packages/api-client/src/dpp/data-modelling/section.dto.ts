import type { DataFieldDto } from './data-field.dto'
import type { GranularityLevel } from './granularity-level'

export enum SectionType {
  GROUP = 'Group',
  REPEATABLE = 'Repeatable',
}

export interface SectionDto {
  id: string
  name: string
  type: SectionType
  parentId?: string
  subSections: string[]
  dataFields: DataFieldDto[]
  granularityLevel?: GranularityLevel
}
