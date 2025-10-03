import type { AxiosInstance } from 'axios'
import type { ApiClientOptions, IApiClient } from '../api-client'
import { createAxiosClient } from '../api-client'
import { PassportMetricNamespace } from './passport-metric/passport-metric.namespace'

export class AnalyticsApiClient implements IApiClient {
  public passportMetric!: PassportMetricNamespace
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
      'https://analytics.cloud.open-dpp.de',
    )
    this.passportMetric = new PassportMetricNamespace(
      this.axiosInstance,
      this.options.activeOrganizationId,
    )
  }
}
