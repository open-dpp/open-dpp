import type { AxiosInstance, AxiosResponse } from 'axios'
import type { ApiClientOptions, IApiClient } from '../api-client'
import { createAxiosClient } from '../api-client'

export class StatusApiClient implements IApiClient {
  private axiosInstance!: AxiosInstance
  private options: ApiClientOptions

  constructor(options: ApiClientOptions = {}) {
    this.options = options
    this.createNewAxiosInstance()
  }

  public setApiKey(apiKey: string) {
    this.options.apiKey = apiKey
    this.createNewAxiosInstance()
  }

  public setActiveOrganizationId(id: string) {
    this.options.activeOrganizationId = id
    this.createNewAxiosInstance()
  }

  public async get(): Promise<AxiosResponse<{ version: string }>> {
    return this.axiosInstance.get<{ version: string }>('/status')
  }

  private createNewAxiosInstance() {
    this.axiosInstance = createAxiosClient(
      this.options,
      'https://api.cloud.open-dpp.de',
    )
  }
}
