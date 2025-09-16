import {
  dataValueDocumentation,
  uniqueProductIdentifierDocumentation,
} from '../product-passport-data/presentation/dto/docs/product-passport-data.doc';

export const createModelDocumentation = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    templateId: { type: 'string', format: 'uuid' },
    marketplaceResourceId: { type: 'string', format: 'uuid' },
  },
  description: 'Either templateId or marketplaceResourceId must be provided.',
  required: ['name'],
};

export const updateModelDocumentation = {
  ...createModelDocumentation,
  required: [],
};

export const modelDocumentation = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string' },
    uniqueProductIdentifiers: {
      type: 'array',
      items: { ...uniqueProductIdentifierDocumentation },
    },
    templateId: { type: 'string', format: 'uuid' },
    dataValues: { type: 'array', items: { ...dataValueDocumentation } },
    owner: { type: 'string', format: 'uuid' },
  },
  required: ['id', 'name', 'uniqueProductIdentifiers', 'dataValues', 'owner'],
};
