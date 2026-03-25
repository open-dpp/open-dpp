import type { AxiosInstance } from 'axios'
import type {
  PageViewCreateDto,
  PageViewDto,
  PassportMeasurementDto,
  PassportMetricQueryDto,
} from './passport-metric.dtos'

export class PassportMetricNamespace {
  constructor(
    public readonly axiosInstance: AxiosInstance,
  ) {}

  private get metricsEndpoint() {
    return `/passport-metrics`
  }

  public async addPageView(data: PageViewCreateDto) {
    return this.axiosInstance.post<PageViewDto>(
      '/passport-metrics/page-views',
      data,
    )
  }

  public async query(query: PassportMetricQueryDto) {
    return this.axiosInstance.get<PassportMeasurementDto[]>(
      this.metricsEndpoint,
      { params: query },
    )
  }
}
