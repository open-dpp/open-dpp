import { randomUUID } from 'node:crypto'
import { expect } from '@jest/globals'
import { DataValue } from './data-value'

describe('dataValue', () => {
  it('should be created', () => {
    const dataSectionId = randomUUID()
    const dataFieldId = randomUUID()
    const dataValue = DataValue.create({
      value: undefined,
      dataSectionId,
      dataFieldId,
      row: 0,
    })
    expect(dataValue.value).toBeUndefined()
    expect(dataValue.dataSectionId).toEqual(dataSectionId)
    expect(dataValue.dataFieldId).toEqual(dataFieldId)
  })
})
