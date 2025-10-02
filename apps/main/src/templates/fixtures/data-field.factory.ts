import type { DataFieldDbProps } from '../domain/data-field'
import { randomUUID } from 'node:crypto'
import { Factory } from 'fishery'
import { DataFieldType } from '../../data-modelling/domain/data-field-base'
import { GranularityLevel } from '../../data-modelling/domain/granularity-level'

export const dataFieldDbPropsFactory = Factory.define<DataFieldDbProps>(() => ({
  id: randomUUID(),
  type: DataFieldType.TEXT_FIELD,
  name: 'Processor',
  granularityLevel: GranularityLevel.MODEL,
}))
