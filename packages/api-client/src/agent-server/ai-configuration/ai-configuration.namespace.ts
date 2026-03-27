import type { AxiosInstance } from 'axios'
import type {
  AiConfigurationDto,
  AiConfigurationUpsertDto,
} from './ai-configuration.dtos'

export class AiConfigurationNamespace {
  constructor(
    public readonly axiosInstance: AxiosInstance,
  ) {}

  private get configurationsEndpoint() {
    return `/configurations`
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
