import type { SubmodelModificationDto } from '@open-dpp/dto'
import { randomUUID } from 'node:crypto'
import { Language } from '@open-dpp/dto'
import { Factory } from 'fishery'

export const submodelModificationPlainFactory = Factory.define<SubmodelModificationDto>(
  () => ({
    idShort: randomUUID(),
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
  }),
)
