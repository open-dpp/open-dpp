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
    private readonly organizationId?: string,
  ) {}

  private get configurationsEndpoint() {
    if (!this.organizationId) {
      throw new Error(
        'Active organizationId is required for passport metric operations. Did you call setActiveOrganizationId()?',
      )
    }
    return `/organizations/${this.organizationId}/passport-metrics`
  }

  public async addPageView(data: PageViewCreateDto) {
    return this.axiosInstance.post<PageViewDto>(
      '/passport-metrics/page-views',
      data,
    )
  }

  public async query(query: PassportMetricQueryDto) {
    return this.axiosInstance.get<PassportMeasurementDto[]>(
      this.configurationsEndpoint,
      { params: query },
    )
  }
}
