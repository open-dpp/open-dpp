import type { ProductPassportDto } from '../../../src'
import { randomUUID } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import { baseURL } from './index'

export const productPassport: ProductPassportDto = {
  id: randomUUID(),
  name: 'name',
  description: 'description',
  mediaReferences: [randomUUID(), randomUUID()],
  dataSections: [],
}

export const productPassportHandlers = [
  http.get(`${baseURL}/product-passports/${productPassport.id}`, () => {
    return HttpResponse.json({ ...productPassport })
  }),
]
