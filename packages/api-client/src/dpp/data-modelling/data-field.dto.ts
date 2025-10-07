import type { GranularityLevel } from './granularity-level'

export enum DataFieldType {
  TEXT_FIELD = 'TextField',
  PRODUCT_PASSPORT_LINK = 'ProductPassportLink',
  NUMERIC_FIELD = 'NumericField',
  FILE_FIELD = 'FileField',
}

export interface DataFieldDto {
  id: string
  name: string
  type: DataFieldType
  options?: Record<string, unknown>
  granularityLevel: GranularityLevel
}
