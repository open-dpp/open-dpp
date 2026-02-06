import type { PropertyModificationSchema } from '@open-dpp/dto'
import type { z } from 'zod/index'
import { randomUUID } from 'node:crypto'
import { Language } from '@open-dpp/dto'
import { Factory } from 'fishery'

export const propertyModificationPlainFactory
  = Factory.define<z.input<typeof PropertyModificationSchema>> (() => ({
    idShort: randomUUID(),
    value: `some-value`,
    displayName: [
      {
        language: Language.de,
        text: 'Neuer Submodel Name',
      },
    ],
    description: [
      {
        language: Language.en,
        text: 'New Submodel Description',
      },
    ],
  }))
