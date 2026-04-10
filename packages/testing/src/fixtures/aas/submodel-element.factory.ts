import type {
  PropertyJsonSchema,
} from '@open-dpp/dto'
import type { z } from 'zod'
import { randomUUID } from 'node:crypto'
import {
  DataTypeDef,
} from '@open-dpp/dto'
import { Factory } from 'fishery'

export const propertyInputPlainFactory
  = Factory.define<z.input<typeof PropertyJsonSchema>> (() => ({
    modelType: 'Property',
    value: `some-value`,
    valueType: 'xs:string',
    idShort: randomUUID(),
  }))

export const propertyOutputPlainFactory
  = Factory.define<z.infer<typeof PropertyJsonSchema>> (() => ({
    value: `some-value`,
    valueType: DataTypeDef.String,
    idShort: randomUUID(),
    extensions: [],
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
  }))
