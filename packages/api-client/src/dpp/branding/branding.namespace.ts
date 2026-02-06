import type { BrandingDto } from '@open-dpp/dto'
import type { AxiosInstance } from 'axios'

export class BrandingNamespace {
  private readonly brandingEndpoint = '/branding'

  constructor(
    private readonly axiosInstance: AxiosInstance,
  ) {
  }

  public async get() {
    return await this.axiosInstance.get<BrandingDto>(
      this.brandingEndpoint,
    )
  }
}
