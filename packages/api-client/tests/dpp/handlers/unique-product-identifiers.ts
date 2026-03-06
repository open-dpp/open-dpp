import type {
  UniqueProductIdentifierMetadataDto,
  UniqueProductIdentifierReferenceDto,
} from '../../../src'
import { randomUUID } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import {
  GranularityLevel,
} from '../../../src'
import { baseURL } from './index'

export const uniqueProductIdentifierId = randomUUID()
export const uniqueProductIdentifierReference: UniqueProductIdentifierReferenceDto
  = {
    id: randomUUID(),
    organizationId: randomUUID(),
    modelId: randomUUID(),
    granularityLevel: GranularityLevel.MODEL,
  }

export const uniqueProductIdentifierMetadata: UniqueProductIdentifierMetadataDto
  = {
    organizationId: randomUUID(),
    passportId: randomUUID(),
    modelId: randomUUID(),
    templateId: randomUUID(),
  }
export const uniqueProductIdentifierHandlers = [
  http.get(
    `${baseURL}/unique-product-identifiers/${uniqueProductIdentifierId}/metadata`,
    () => {
      return HttpResponse.json({ ...uniqueProductIdentifierMetadata })
    },
  ),
]
