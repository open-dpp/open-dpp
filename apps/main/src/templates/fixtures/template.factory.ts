import type { TemplateCreateProps } from '../domain/template'
import { randomUUID } from 'node:crypto'
import { Sector } from '@open-dpp/api-client'
import { Factory } from 'fishery'

export const templateCreatePropsFactory = Factory.define<TemplateCreateProps>(
  () => ({
    name: 'Laptop',
    description: 'My Laptop',
    sectors: [Sector.ELECTRONICS],
    organizationId: randomUUID(),
    userId: randomUUID(),
  }),
)
