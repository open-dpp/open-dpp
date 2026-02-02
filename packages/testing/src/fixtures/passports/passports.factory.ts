import type { PassportDtoSchema } from '@open-dpp/dto'
import type { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { Factory } from 'fishery'

interface PassportTransient {
  organizationId?: string
  templateId?: string
}

export const passportsPlainFactory
  = Factory.define<z.infer<typeof PassportDtoSchema>, PassportTransient> (({ transientParams }) => ({
    id: randomUUID(),
    organizationId: transientParams.organizationId ?? randomUUID(),
    environment: {
      assetAdministrationShells: [],
      submodels: [],
      conceptDescriptions: [],
    },
    templateId: transientParams.templateId ?? null,
    createdAt: new Date(Date.now()).toISOString(),
    updatedAt: new Date(Date.now()).toISOString(),
  }))
