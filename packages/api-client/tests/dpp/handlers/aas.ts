import { randomUUID } from 'node:crypto'
import {
  AssetAdministrationShellJsonSchema,
  SubmodelBaseJsonSchema,
  SubmodelJsonSchema,
  ValueResponseDtoSchema,
} from '@open-dpp/dto'
import {
  aasPlainFactory,
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductValuePlainFactory,
} from '@open-dpp/testing'
import { http, HttpResponse } from 'msw'
import { checkQueryParameters } from '../../utils'
import { baseURL } from './index'

export const paginationParams = { limit: 10, cursor: randomUUID() }
export const aasWrapperId = randomUUID()
export const iriDomain = `https://open-dpp.de/${randomUUID()}`
export const aasResponse = AssetAdministrationShellJsonSchema.parse(aasPlainFactory.build(undefined, { transient: { iriDomain } }))
export const submodelCarbonFootprintResponse = SubmodelJsonSchema.parse(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }))
export const submodelElement0 = SubmodelBaseJsonSchema.parse(submodelCarbonFootprintResponse.submodelElements[0])
export const submodelDesignOfProduct = submodelDesignOfProductValuePlainFactory.build()
export const submodelValueResponse = ValueResponseDtoSchema.parse(submodelDesignOfProduct)
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

      return errorResponse || HttpResponse.json([submodelCarbonFootprintResponse], {
        status: 200,
      })
    }),
    http.get(`${templatesEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelDesignOfProduct.id)}/$value`, async ({ request }) => {
      return HttpResponse.json(submodelValueResponse, {
        status: 200,
      })
    }),
    http.get(`${templatesEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelCarbonFootprintResponse.id)}`, async () => {
      return HttpResponse.json(submodelCarbonFootprintResponse, {
        status: 200,
      })
    }),
    http.get(`${templatesEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelCarbonFootprintResponse.id)}/submodel-elements`, async () => {
      return HttpResponse.json(submodelCarbonFootprintResponse.submodelElements, {
        status: 200,
      })
    }),
    http.get(`${templatesEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelCarbonFootprintResponse.id)}/submodel-elements/${submodelElement0.idShort}`, async () => {
      return HttpResponse.json(submodelCarbonFootprintResponse.submodelElements[0], {
        status: 200,
      })
    }),
  ]
}
