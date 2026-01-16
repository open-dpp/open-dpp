import { randomUUID } from 'node:crypto'
import {
  AssetAdministrationShellJsonSchema,
  SubmodelBaseJsonSchema,
  SubmodelElementSchema,
  SubmodelJsonSchema,
  ValueResponseDtoSchema,
} from '@open-dpp/dto'
import {
  aasPlainFactory,
  propertyPlainFactory,
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
  submodelDesignOfProductValuePlainFactory,
} from '@open-dpp/testing'
import { http, HttpResponse } from 'msw'
import { checkQueryParameters } from '../../utils'
import { baseURL } from './index'

export const paginationParams = { limit: 10, cursor: randomUUID() }
export const aasWrapperId = randomUUID()
export const iriDomain = `https://open-dpp.de/${randomUUID()}`
export const aasResponse = AssetAdministrationShellJsonSchema.parse(
  aasPlainFactory.build(undefined, { transient: { iriDomain } }),
)
export const submodelCarbonFootprintResponse = SubmodelJsonSchema.parse(
  submodelCarbonFootprintPlainFactory.build(undefined, {
    transient: { iriDomain },
  }),
)
export const submodelCarbonFootprintElement0 = SubmodelBaseJsonSchema.parse(
  submodelCarbonFootprintResponse.submodelElements[0],
)
export const submodelDesignOfProduct = SubmodelJsonSchema.parse(
  submodelDesignOfProductPlainFactory.build(),
)
export const submodelDesignOfProductElement0 = SubmodelBaseJsonSchema.parse(
  submodelDesignOfProduct.submodelElements[0],
)
export const submodelValueResponse: { Design_V01: any }
  = ValueResponseDtoSchema.parse(
    submodelDesignOfProductValuePlainFactory.build(),
  ) as { Design_V01: any }
export const propertyToAdd = propertyPlainFactory.build(undefined, {
  transient: { iriDomain },
})
export function aasHandlers(basePath: string) {
  const aasEndpointUrl = `${baseURL}/${basePath}`

  return [
    http.get(
      `${aasEndpointUrl}/${aasWrapperId}/shells`,
      async ({ request }) => {
        const errorResponse = checkQueryParameters(request, {
          limit: paginationParams.limit.toFixed(),
        })

        return (
          errorResponse
          || HttpResponse.json({
            paging_metadata: {
              cursor: aasResponse.id,
            },
            result: [aasResponse],
          }, {
            status: 200,
          })
        )
      },
    ),
    http.get(
      `${aasEndpointUrl}/${aasWrapperId}/submodels`,
      async ({ request }) => {
        const errorResponse = checkQueryParameters(request, {
          limit: paginationParams.limit.toFixed(),
        })

        return (
          errorResponse
          || HttpResponse.json([submodelCarbonFootprintResponse], {
            status: 200,
          })
        )
      },
    ),
    http.get(
      `${aasEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelDesignOfProduct.id)}/$value`,
      async () => {
        return HttpResponse.json(submodelValueResponse, {
          status: 200,
        })
      },
    ),
    http.get(
      `${aasEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelCarbonFootprintResponse.id)}`,
      async () => {
        return HttpResponse.json(submodelCarbonFootprintResponse, {
          status: 200,
        })
      },
    ),
    http.get(
      `${aasEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelCarbonFootprintResponse.id)}/submodel-elements`,
      async () => {
        return HttpResponse.json(
          submodelCarbonFootprintResponse.submodelElements,
          {
            status: 200,
          },
        )
      },
    ),
    http.get(
      `${aasEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelCarbonFootprintResponse.id)}/submodel-elements/${submodelCarbonFootprintElement0.idShort}`,
      async () => {
        return HttpResponse.json(
          submodelCarbonFootprintResponse.submodelElements[0],
          {
            status: 200,
          },
        )
      },
    ),
    http.get(
      `${aasEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelDesignOfProduct.id)}/submodel-elements/${submodelDesignOfProductElement0.idShort}/$value`,
      async () => {
        return HttpResponse.json(submodelValueResponse.Design_V01, {
          status: 200,
        })
      },
    ),
    http.post(`${aasEndpointUrl}/${aasWrapperId}/submodels`, async () => {
      return HttpResponse.json(submodelCarbonFootprintResponse, {
        status: 200,
      })
    }),
    http.patch(`${aasEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelCarbonFootprintResponse.id)}`, async () => {
      return HttpResponse.json(submodelCarbonFootprintResponse, {
        status: 200,
      })
    }),
    http.post(
      `${aasEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelCarbonFootprintResponse.id)}/submodel-elements`,
      async () => {
        return HttpResponse.json(SubmodelElementSchema.parse(propertyToAdd), {
          status: 200,
        })
      },
    ),
    http.post(
      `${aasEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelCarbonFootprintResponse.id)}/submodel-elements/${submodelCarbonFootprintElement0.idShort}`,
      async () => {
        return HttpResponse.json(SubmodelElementSchema.parse(propertyToAdd), {
          status: 200,
        })
      },
    ),
    http.patch(`${aasEndpointUrl}/${aasWrapperId}/submodels/${btoa(submodelCarbonFootprintResponse.id)}/submodel-elements/${submodelCarbonFootprintElement0.idShort}`, async () => {
      return HttpResponse.json(SubmodelElementSchema.parse(propertyToAdd), {
        status: 200,
      })
    }),
  ]
}
