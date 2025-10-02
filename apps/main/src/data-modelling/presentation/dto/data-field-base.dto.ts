import type { DataFieldBase } from '../../domain/data-field-base'
import { z } from 'zod'
import { DataFieldType } from '../../domain/data-field-base'
import { GranularityLevel } from '../../domain/granularity-level'

export const DataFieldBaseSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  type: z.enum(DataFieldType),
  options: z.record(z.string(), z.unknown()).optional(),
  granularityLevel: z.enum(GranularityLevel),
})

export function dataFieldToDto(dataField: DataFieldBase) {
  return DataFieldBaseSchema.parse({
    id: dataField.id,
    name: dataField.name,
    type: dataField.type,
    options: dataField.options,
    granularityLevel: dataField.granularityLevel,
  })
}
