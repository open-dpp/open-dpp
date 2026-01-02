import type {
  DataFieldDto,
  SectionDto,
  TemplateDraftDto,
  TemplateDraftGetAllDto,
} from '../../../src'
import { randomUUID } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import {
  DataFieldType,
  GranularityLevel,
  SectionType,
  Sector,
} from '../../../src'
import { activeOrganization } from '../../organization'
import { baseURL } from './index'
import { oldTemplate } from './old-template'

const dataModelId = randomUUID()

export const templateDraft: TemplateDraftDto = {
  id: dataModelId,
  name: 'Laptop neu',
  description: 'My desc',
  sectors: [Sector.ELECTRONICS],
  version: '1.0.0',
  publications: [],
  createdByUserId: randomUUID(),
  ownedByOrganizationId: randomUUID(),
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
}

export const draftsOfOrganization: TemplateDraftGetAllDto[] = [
  { id: templateDraft.id, name: templateDraft.name },
  { id: randomUUID(), name: 'Other draft' },
]

export const sectionDraft: SectionDto = {
  id: randomUUID(),
  name: 'sect',
  type: SectionType.GROUP,
  dataFields: [],
  subSections: [],
}

export const dataFieldDraft: DataFieldDto = {
  id: randomUUID(),
  name: 'sect',
  type: DataFieldType.TEXT_FIELD,
  options: {},
  granularityLevel: GranularityLevel.MODEL,
}

const draftEndpointUrl = `${baseURL}/organizations/${activeOrganization.id}/template-drafts`

export const templateDraftsHandlers = [
  http.post(`${draftEndpointUrl}`, async () => {
    return HttpResponse.json(templateDraft, {
      status: 201,
    })
  }),
  http.post(`${draftEndpointUrl}/${templateDraft.id}/sections`, async () => {
    return HttpResponse.json(templateDraft, {
      status: 201,
    })
  }),
  http.post(
    `${draftEndpointUrl}/${templateDraft.id}/sections/${sectionDraft.id}`,
    async () => {
      return HttpResponse.json(templateDraft, {
        status: 200,
      })
    },
  ),
  http.post(
    `${draftEndpointUrl}/${templateDraft.id}/sections/${sectionDraft.id}/move`,
    async () => {
      return HttpResponse.json(templateDraft, {
        status: 201,
      })
    },
  ),
  http.post(
    `${draftEndpointUrl}/${templateDraft.id}/sections/${sectionDraft.id}/data-fields`,
    async () => {
      return HttpResponse.json(templateDraft, {
        status: 201,
      })
    },
  ),
  http.post(
    `${draftEndpointUrl}/${templateDraft.id}/sections/${sectionDraft.id}/data-fields/${dataFieldDraft.id}/move`,
    async () => {
      return HttpResponse.json(templateDraft, {
        status: 201,
      })
    },
  ),
  http.patch(
    `${draftEndpointUrl}/${templateDraft.id}/sections/${sectionDraft.id}/data-fields/${dataFieldDraft.id}`,
    async () => {
      return HttpResponse.json(templateDraft, {
        status: 200,
      })
    },
  ),

  http.delete(
    `${draftEndpointUrl}/${templateDraft.id}/sections/${sectionDraft.id}/data-fields/${dataFieldDraft.id}`,
    async () => {
      return HttpResponse.json(templateDraft, {
        status: 200,
      })
    },
  ),

  http.delete(
    `${draftEndpointUrl}/${templateDraft.id}/sections/${sectionDraft.id}`,
    async () => {
      return HttpResponse.json(templateDraft, {
        status: 200,
      })
    },
  ),

  http.patch(
    `${draftEndpointUrl}/${templateDraft.id}/sections/${sectionDraft.id}`,
    async () => {
      return HttpResponse.json(templateDraft, {
        status: 200,
      })
    },
  ),
  http.get(`${draftEndpointUrl}`, async () => {
    return HttpResponse.json(draftsOfOrganization, {
      status: 200,
    })
  }),

  http.get(`${draftEndpointUrl}/${templateDraft.id}`, async () => {
    return HttpResponse.json(templateDraft, {
      status: 200,
    })
  }),

  http.patch(`${draftEndpointUrl}/${templateDraft.id}`, async () => {
    return HttpResponse.json(templateDraft, {
      status: 200,
    })
  }),

  http.post(`${draftEndpointUrl}/${templateDraft.id}/publish`, async () => {
    return HttpResponse.json(oldTemplate, {
      status: 201,
    })
  }),
]
