import type { ValueResponseDto } from './value-response.dto'
import { expect } from '@jest/globals'
import { ValueSchema } from './value-response.dto'

describe('valueResponseDto', () => {
  it('parses value', () => {
    const value: ValueResponseDto = { Design_V01: { AdditionalInformation: { MultilanguageProp: [
      {
        de: 'Schnelle Übersicht',
      },
      {
        en: 'Quick Overview',
      },
    ] } } }
    expect(ValueSchema.safeParse(value).success).toBeTruthy()
  })
})
