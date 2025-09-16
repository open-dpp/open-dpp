import {
  dataValueDocumentation,
  uniqueProductIdentifierDocumentation,
} from '../product-passport-data/presentation/dto/docs/product-passport-data.doc';

export const itemDocumentation = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    uniqueProductIdentifiers: {
      type: 'array',
      items: { ...uniqueProductIdentifierDocumentation },
    },
    templateId: { type: 'string', format: 'uuid' },
    dataValues: { type: 'array', items: { ...dataValueDocumentation } },
  },
  required: ['id', 'uniqueProductIdentifiers', 'templateId', 'dataValues'],
};

export const modelParamDocumentation = {
  name: 'modelId',
  description: 'The id of the model. A item always belongs to a model.',
  required: true,
  type: 'string',
  format: 'uuid',
};

export const itemParamDocumentation = {
  name: 'itemId',
  description: 'The id of the item.',
  required: true,
  type: 'string',
  format: 'uuid',
};
