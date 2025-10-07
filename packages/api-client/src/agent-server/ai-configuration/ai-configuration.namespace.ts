import type { AxiosInstance } from 'axios'
import type {
  AiConfigurationDto,
  AiConfigurationUpsertDto,
} from './ai-configuration.dtos'

export class AiConfigurationNamespace {
  constructor(
    public readonly axiosInstance: AxiosInstance,
    private readonly organizationId?: string,
  ) {}

  private get configurationsEndpoint() {
    if (!this.organizationId) {
      throw new Error(
        'Active organizationId is required for AI Configuration operations. Did you call setActiveOrganizationId()?',
      )
    }
    return `/organizations/${this.organizationId}/configurations`
  }

  public async upsert(data: AiConfigurationUpsertDto) {
    return this.axiosInstance.put<AiConfigurationDto>(
      this.configurationsEndpoint,
      data,
    )
  }

  public async get() {
    return this.axiosInstance.get<AiConfigurationDto>(
      this.configurationsEndpoint,
    )
  }
}
