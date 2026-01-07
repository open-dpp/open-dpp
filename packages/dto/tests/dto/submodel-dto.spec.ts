import { randomUUID } from 'node:crypto'

import { SubmodelRequestDtoSchema } from '../../src'

describe('submodelDto', () => {
  it('should parse', async () => {
    const json = { idShort: randomUUID() }
    expect(SubmodelRequestDtoSchema.parse(json)).toEqual({
      description: [],
      displayName: [],
      embeddedDataSpecifications: [],
      extensions: [],
      id: expect.any(String),
      qualifiers: [],
      submodelElements: [],
      supplementalSemanticIds: [],
      idShort: json.idShort,
    })
  })
})
