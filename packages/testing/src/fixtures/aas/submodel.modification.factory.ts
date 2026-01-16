import type { SubmodelModificationDto } from '@open-dpp/dto'
import { Language } from '@open-dpp/dto'
import { Factory } from 'fishery'

export const submodelModificationPlainFactory = Factory.define<SubmodelModificationDto>(
  () => ({
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
