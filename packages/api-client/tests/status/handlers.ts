import { http, HttpResponse } from 'msw'

const baseURL = 'https://api.cloud.open-dpp.de'

export const statusResponse = { version: '0.1.0' }

export const statusHandlers = [
  http.get(`${baseURL}/status`, () => {
    return HttpResponse.json(statusResponse)
  }),
]
