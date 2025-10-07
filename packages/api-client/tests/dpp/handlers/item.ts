import type { ItemDto } from '../../../src'
import { randomUUID } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import { activeOrganization } from '../../organization'
import { baseURL } from './index'
import { dataFieldId, dataSectionId, model } from './model'

export const item1: ItemDto = {
  id: randomUUID(),
  uniqueProductIdentifiers: [],
  dataValues: [],
  templateId: randomUUID(),
}

export const item2: ItemDto = {
  id: randomUUID(),
  uniqueProductIdentifiers: [],
  dataValues: [],
  templateId: randomUUID(),
}

export const itemHandlers = [
  http.post(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/items`,
    () => {
      return HttpResponse.json(item1)
    },
  ),
  http.get(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/items`,
    () => {
      return HttpResponse.json([item1, item2])
    },
  ),
  http.get(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/items/${item1.id}`,
    () => {
      return HttpResponse.json(item1)
    },
  ),
  http.patch(
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/items/${item1.id}/data-values`,
    async ({ request }) => {
      const body: any = await request.json()
      return HttpResponse.json(
        {
          ...item1,
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
    `${baseURL}/organizations/${activeOrganization.id}/models/${model.id}/items/${item1.id}/data-values`,
    async ({ request }) => {
      const body: any = await request.json()
      return HttpResponse.json(
        {
          ...item1,
          dataValues: body.map((b: any) => ({
            ...b,
          })),
        },
        { status: 201 },
      )
    },
  ),
]
