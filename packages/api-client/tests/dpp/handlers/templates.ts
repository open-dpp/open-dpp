import { randomUUID } from 'node:crypto'

import { templatesPlainFactory } from '@open-dpp/testing'
import { http, HttpResponse } from 'msw'
import { activeOrganization } from '../../organization'
import { checkQueryParameters } from '../../utils'
import { baseURL } from './index'

export const paginationParams = { limit: 10, cursor: randomUUID() }
export const template1 = templatesPlainFactory.build({ organizationId: activeOrganization.id })
export const template2 = templatesPlainFactory.build({ organizationId: activeOrganization.id })

export function templatesHandlers() {
  const templatesEndpointUrl = `${baseURL}/templates`

  return [
    http.get(
      `${templatesEndpointUrl}`,
      async ({ request }) => {
        const errorResponse = checkQueryParameters(request, {
          limit: paginationParams.limit.toFixed(),
        })

        return (
          errorResponse
          || HttpResponse.json({
            paging_metadata: {
              cursor: template2.id,
            },
            result: [template1, template2],
          }, {
            status: 200,
          })
        )
      },
    ),
  ]
}
