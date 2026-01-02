import type { TemplateDtoSchema } from '@open-dpp/dto'
import type { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { Factory } from 'fishery'

export const templatesPlainFactory
  = Factory.define<z.infer<typeof TemplateDtoSchema>> (() => ({
    id: randomUUID(),
    organizationId: randomUUID(),
    environment: {
      assetAdministrationShells: [],
      submodels: [],
      conceptDescriptions: [],
    },
    createdAt: new Date(Date.now()),
    updatedAt: new Date(Date.now()),
  }))
