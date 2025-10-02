import type { DataFieldDraftDbProps } from '../domain/data-field-draft'
import { randomUUID } from 'node:crypto'
import { Factory } from 'fishery'
import { DataFieldType } from '../../data-modelling/domain/data-field-base'
import { GranularityLevel } from '../../data-modelling/domain/granularity-level'

export const dataFieldDraftDbPropsFactory
  = Factory.define<DataFieldDraftDbProps>(({ params }) => ({
    id: params.id ?? randomUUID(),
    type: DataFieldType.TEXT_FIELD,
    name: 'Title',
    options: { max: 2 },
    granularityLevel: GranularityLevel.MODEL,
  }))

export const textFieldProps = dataFieldDraftDbPropsFactory.params({
  type: DataFieldType.TEXT_FIELD,
})

export const numericFieldProps = dataFieldDraftDbPropsFactory.params({
  type: DataFieldType.NUMERIC_FIELD,
})
