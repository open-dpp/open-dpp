import { randomUUID } from 'node:crypto'
import { AssetAdministrationShellJsonSchema, SubmodelJsonSchema } from '@open-dpp/dto'
import { aasPlainFactory, submodelCarbonFootprintPlainFactory } from '@open-dpp/testing'
import { http, HttpResponse } from 'msw'
import { checkQueryParameters } from '../../utils'
import { baseURL } from './index'

export const paginationParams = { limit: 10, cursor: randomUUID() }
export const aasWrapperId = randomUUID()
export const iriDomain = `https://open-dpp.de/${randomUUID()}`
export const aasResponse = AssetAdministrationShellJsonSchema.parse(aasPlainFactory.build(undefined, { transient: { iriDomain } }))
export const submodelResponse = SubmodelJsonSchema.parse(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }))
export function aasHandlers(basePath: string) {
  const templatesEndpointUrl = `${baseURL}/${basePath}`

  return [
    http.get(`${templatesEndpointUrl}/${aasWrapperId}/shells`, async ({ request }) => {
      const errorResponse = checkQueryParameters(request, { limit: paginationParams.limit.toFixed() })

      return errorResponse || HttpResponse.json([aasResponse], {
        status: 200,
      })
    }),
    http.get(`${templatesEndpointUrl}/${aasWrapperId}/submodels`, async ({ request }) => {
      const errorResponse = checkQueryParameters(request, { limit: paginationParams.limit.toFixed() })

      return errorResponse || HttpResponse.json([submodelResponse], {
        status: 200,
      })
    }),
    http.get(`${templatesEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelResponse.id)}`, async () => {
      return HttpResponse.json(submodelResponse, {
        status: 200,
      })
    }),
  ]
}
