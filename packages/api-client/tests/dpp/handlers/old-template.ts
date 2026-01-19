import type {
  TemplateDto,
} from '../../../src'
import { randomUUID } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import {
  DataFieldType,
  GranularityLevel,
  SectionType,
} from '../../../src'
import { activeOrganization } from '../../organization'
import { baseURL } from './index'

const dataModelId = randomUUID()

export const oldTemplate: TemplateDto = {
  id: dataModelId,
  name: 'Laptop neu',
  version: '1.0',
  sections: [
    {
      id: randomUUID(),
      type: SectionType.GROUP,
      name: 'section name',
      dataFields: [
        {
          id: randomUUID(),
          options: {
            min: 24,
          },
          name: 'Prozessor',
          type: DataFieldType.TEXT_FIELD,
          granularityLevel: GranularityLevel.MODEL,
        },
      ],
      subSections: [],
    },
  ],
  ownedByOrganizationId: activeOrganization.id,
  createdByUserId: randomUUID(),
}

const templatesEndpointUrl = `${baseURL}/organizations/${activeOrganization.id}/templates`

export const templateHandlers = [
  http.get(templatesEndpointUrl, async () => {
    return HttpResponse.json([{ id: oldTemplate.id, name: oldTemplate.name }], {
      status: 200,
    })
  }),
  http.get(`${templatesEndpointUrl}/${oldTemplate.id}`, async () => {
    return HttpResponse.json(oldTemplate, { status: 200 })
  }),
]
