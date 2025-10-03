import type {
  AasConnectionDto,
  AasConnectionGetAllDto,
  AasPropertyWithParentDto,
} from '../../../src'
import { randomUUID } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import {
  AssetAdministrationShellType,
} from '../../../src'
import { activeOrganization } from '../../organization'
import { baseURL } from './index'

export const connection: AasConnectionDto = {
  id: randomUUID(),
  modelId: randomUUID(),
  name: 'Connection 1',
  dataModelId: randomUUID(),
  aasType: AssetAdministrationShellType.Truck,
  fieldAssignments: [
    {
      dataFieldId: randomUUID(),
      sectionId: randomUUID(),
      idShortParent: 'Parent',
      idShort: 'Child',
    },
  ],
}

export const connectionList: AasConnectionGetAllDto[] = [
  { id: randomUUID(), name: 'Connection 1' },
  { id: randomUUID(), name: 'Connection 2' },
]

export const aasPropertiesWithParent: AasPropertyWithParentDto[] = [
  {
    parentIdShort: randomUUID(),
    property: {
      idShort: randomUUID(),
      valueType: 'xs:double',
      modelType: 'Property',
    },
  },
]

export const aasIntegrationHandlers = [
  http.get(
    `${baseURL}/organizations/${activeOrganization.id}/integration/aas/connections/${connection.id}`,
    () => {
      return HttpResponse.json({ ...connection })
    },
  ),
  http.get(
    `${baseURL}/organizations/${activeOrganization.id}/integration/aas/connections`,
    () => {
      return HttpResponse.json(connectionList)
    },
  ),
  http.post(
    `${baseURL}/organizations/${activeOrganization.id}/integration/aas/connections`,
    () => {
      return HttpResponse.json({ ...connection })
    },
  ),
  http.patch(
    `${baseURL}/organizations/${activeOrganization.id}/integration/aas/connections/${connection.id}`,
    () => {
      return HttpResponse.json({ ...connection })
    },
  ),
  http.get(
    `${baseURL}/organizations/${activeOrganization.id}/integration/aas/Truck/properties`,
    () => {
      return HttpResponse.json(aasPropertiesWithParent)
    },
  ),
]
