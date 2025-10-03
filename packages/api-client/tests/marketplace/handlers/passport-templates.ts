import type { PassportTemplateDto } from '../../../src'
import { randomUUID } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import { Sector } from '../../../src'
import { activeOrganization } from '../../organization'
import { marketplaceURL } from './index'

export const nowDate = new Date('2025-01-01T12:00:00Z')

export const passportTemplate: PassportTemplateDto = {
  id: randomUUID(),
  name: 'test',
  description: 'test description',
  version: '1.0.0',
  isOfficial: true,
  sectors: [Sector.BATTERY],
  website: 'https://open-dpp.de',
  contactEmail: 'test@example.com',
  organizationName: 'open-dpp',
  templateData: {
    id: randomUUID(),
    name: 'my name',
    version: '1.0.0',
    createdByUserId: randomUUID(),
    ownedByOrganizationId: 'organizationId',
    sections: [],
  },
  ownedByOrganizationId: randomUUID(),
  createdByUserId: randomUUID(),
  createdAt: nowDate.toISOString(),
  updatedAt: nowDate.toISOString(),
}

export const passportHandlers = [
  http.post(
    `${marketplaceURL}/organizations/${activeOrganization.id}/templates/passports`,
    () => {
      return HttpResponse.json(passportTemplate)
    },
  ),
  http.get(`${marketplaceURL}/templates/passports`, () => {
    return HttpResponse.json([passportTemplate])
  }),

  http.get(
    `${marketplaceURL}/templates/passports/${passportTemplate.id}`,
    () => {
      return HttpResponse.json(passportTemplate)
    },
  ),
]
