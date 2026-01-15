import type { PropertyJsonSchema } from '@open-dpp/dto'
import type { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { Factory } from 'fishery'

export const propertyPlainFactory
  = Factory.define<z.input<typeof PropertyJsonSchema>> (() => ({
    modelType: 'Property',
    value: `some-value`,
    valueType: 'xs:string',
    idShort: randomUUID(),
  }))
