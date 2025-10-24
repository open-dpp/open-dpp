import type { AxiosRequestConfig } from 'axios'
import axios from 'axios'

export interface IApiClient {
  setApiKey: (apiKey: string) => void
  setActiveOrganizationId: (id: string) => void
}

export interface ApiClientOptions extends AxiosRequestConfig {
  apiKey?: string
  serviceToken?: string
  activeOrganizationId?: string
}

export function createAxiosClient(
  options: ApiClientOptions,
  defaultBaseUrl: string,
) {
  return axios.create({
    ...options,
    baseURL: options.baseURL ?? defaultBaseUrl,
    withCredentials: true,
    headers: {
      ...options.headers,
      service_token: options.serviceToken ? options.serviceToken : '',
      Authorization: options.apiKey ? `Bearer ${options.apiKey}` : '',
    },
  })
}
