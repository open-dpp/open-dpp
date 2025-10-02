import { expect } from '@jest/globals'
import { replaceIdByUnderscoreId, replaceUnderscoreIdToId } from './utils'

describe('replaceIdWithUnderscoreId', () => {
  it('replace id with _id and back', () => {
    const originalObject = {
      id: '123',
      name: 'Sample Object',
      nested: {
        id: '456',
        title: 'Nested Object',
        content: {
          id: '789',
          text: 'Content Text',
        },
        array: [
          { id: '111', name: 'Array Item 1' },
          { id: '222', name: 'Array Item 2' },
        ],
      },
      array: [
        { id: '111', name: 'Array Item 1' },
        { id: '222', name: 'Array Item 2' },
      ],
    }
    const updatedObject = replaceIdByUnderscoreId(originalObject)
    expect(updatedObject).toEqual({
      _id: '123',
      name: 'Sample Object',
      nested: {
        _id: '456',
        title: 'Nested Object',
        content: {
          _id: '789',
          text: 'Content Text',
        },
        array: [
          { _id: '111', name: 'Array Item 1' },
          { _id: '222', name: 'Array Item 2' },
        ],
      },
      array: [
        { _id: '111', name: 'Array Item 1' },
        { _id: '222', name: 'Array Item 2' },
      ],
    })
    expect(replaceUnderscoreIdToId(updatedObject)).toEqual(originalObject)
  })
})
