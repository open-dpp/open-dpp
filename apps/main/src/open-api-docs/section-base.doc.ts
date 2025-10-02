import { GranularityLevel } from '../data-modelling/domain/granularity-level'
import { SectionType } from '../data-modelling/domain/section-base'
import { dataFieldDocumentation } from './data-field-base.doc'

export const sectionBaseDocumentation = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    type: {
      type: 'string',
      enum: Object.values(SectionType),
      description: 'The section type',
    },
    parentId: { type: 'string', nullable: true },
    subSections: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    dataFields: {
      type: 'array',
      items: dataFieldDocumentation,
    },
    granularityLevel: {
      type: 'string',
      enum: Object.values(GranularityLevel),
      nullable: true,
    },
  },
}
