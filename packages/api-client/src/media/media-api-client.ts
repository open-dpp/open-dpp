import type { AxiosInstance } from 'axios'
import type { ApiClientOptions, IApiClient } from '../api-client'
import { createAxiosClient } from '../api-client'
import { MediaNamespace } from './media.namespace'

export class MediaApiClient implements IApiClient {
  public media!: MediaNamespace
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

  private createNewAxiosInstance() {
    this.axiosInstance = createAxiosClient(
      this.options,
      'https://api.cloud.open-dpp.de',
    )
    this.media = new MediaNamespace(this.axiosInstance, this.options.activeOrganizationId)
  }
}
