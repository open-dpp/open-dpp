export const dataValueDocumentation = {
  type: 'object',
  properties: {
    value: {
      oneOf: [
        {
          type: 'string',
          description:
            'Used for text fields, email fields, and other string-based data types',
        },
        {
          type: 'number',
          description:
            'Used for numeric fields like quantities, measurements, or calculations',
        },
      ],
      description: 'The value type depends on the data field type.',
    },
    dataSectionId: { type: 'string', format: 'uuid' },
    dataFieldId: { type: 'string', format: 'uuid' },
    row: { type: 'integer' },
  },
};

export const uniqueProductIdentifierDocumentation = {
  type: 'object',
  properties: {
    uuid: { type: 'string', format: 'uuid' },
    value: { type: 'string' },
  },
};
export const orgaParamDocumentation = {
  name: 'orgaId',
  description: 'The id of the organization you are a member of.',
  required: true,
  type: 'string',
  format: 'uuid',
};
