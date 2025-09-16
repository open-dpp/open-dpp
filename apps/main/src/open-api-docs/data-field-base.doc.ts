import { DataFieldType } from '../data-modelling/domain/data-field-base';
import { GranularityLevel } from '../data-modelling/domain/granularity-level';

export const dataFieldDocumentation = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    type: {
      type: 'string',
      enum: Object.values(DataFieldType),
    },
    options: {
      type: 'object',
      nullable: true,
      description: 'Optional key-value pairs with string keys',
      additionalProperties: true,
    },
    granularityLevel: {
      type: 'string',
      enum: Object.values(GranularityLevel),
      nullable: true,
    },
  },
};
