import type { DataValueDto } from '../../../src'
import { randomUUID } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import { activeOrganization } from '../../organization'
import { baseURL } from './index'
import { template } from './template'

export const updateDataValues: DataValueDto[] = [
  {
    dataFieldId: randomUUID(),
    dataSectionId: randomUUID(),
    value: 'value 1',
    row: 0,
  },
  {
    dataFieldId: randomUUID(),
    dataSectionId: randomUUID(),
    value: 'value 2',
    row: 0,
  },
]

export const mediaReferenceUpdate = {
  id: randomUUID(),
}

export const mediaReferences = [
  {
    id: randomUUID(),
  },
]
export const dataSectionId = randomUUID()
export const dataFieldId = randomUUID()

export const model = {
  uniqueProductIdentifiers: [
    {
      uuid: randomUUID(),
      view: 'all',
      referenceId: randomUUID(),
    },
  ],
  id: randomUUID(),
  dataValues: [],
  name: 'My name',
  mediaReferences: [],
  description: 'My desc',
  owner: randomUUID(),
}

export const responseDataValues: DataValueDto[] = updateDataValues.map(v => ({
  ...v,
  dataSectionId,
  dataFieldId,
}))

export const modelHandlers = [
  http.get(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}`,
    () => {
      return HttpResponse.json(model)
    },
  ),
  http.post(`${baseURL}/organizations/${activeOrganization.id}/models`, () => {
    return HttpResponse.json(model)
  }),
  http.patch(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/data-values`,
    async ({ request }) => {
      const body: any = await request.json()
      return HttpResponse.json(
        {
          ...model,
          dataValues: body.map((b: any) => ({
            ...b,
            dataSectionId,
            dataFieldId,
          })),
        },
        { status: 200 },
      )
    },
  ),
  http.post(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/data-values`,
    async ({ request }) => {
      const body: any = await request.json()
      return HttpResponse.json(
        {
          ...model,
          dataValues: body.map((b: any) => ({
            ...b,
          })),
        },
        { status: 201 },
      )
    },
  ),
  http.post(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/media`,
    async () => {
      return HttpResponse.json(
        {
          ...model,
          mediaReferences: mediaReferences.map(b => b.id),
        },
        { status: 201 },
      )
    },
  ),
  http.delete(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/media/${mediaReferences[0].id}`,
    async () => {
      return HttpResponse.json(
        {
          ...model,
          mediaReferences: [],
        },
        { status: 200 },
      )
    },
  ),
  http.patch(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/media/${mediaReferences[0].id}/move`,
    async () => {
      return HttpResponse.json(
        {
          ...model,
          mediaReferences: mediaReferences.map(b => b.id),
        },
        { status: 200 },
      )
    },
  ),
  http.patch(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/media/${mediaReferences[0].id}`,
    async () => {
      return HttpResponse.json(
        {
          ...model,
          mediaReferences: [mediaReferenceUpdate.id],
        },
        { status: 200 },
      )
    },
  ),
  http.post(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/templates/${template.id}`,
    async () => {
      return HttpResponse.json(
        { ...model, productDataModelId: template.id },
        { status: 201 },
      )
    },
  ),
]
