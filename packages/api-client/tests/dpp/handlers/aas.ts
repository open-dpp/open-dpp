import { randomUUID } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import { baseURL } from './index'
import { template } from './template'

export const templateId = randomUUID()

export function aasHandlers(basePath: string) {
  const templatesEndpointUrl = `${baseURL}/${basePath}`

  return [
    http.get(`${templatesEndpointUrl}/${templateId}/shells`, async () => {
      return HttpResponse.json([{ id: template.id, name: template.name }], {
        status: 200,
      })
    }),
  ]
}
