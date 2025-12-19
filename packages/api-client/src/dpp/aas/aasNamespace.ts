import type { AssetAdministrationShellResponseDto } from '@open-dpp/aas'
import type { AxiosInstance } from 'axios'

export class AasNamespace {
  private readonly aasEndpoint

  constructor(
    private readonly axiosInstance: AxiosInstance,
    readonly basePath: string,
  ) {
    this.aasEndpoint = `/${basePath}`
  }

  public async getShells(id: string) {
    return this.axiosInstance.get<AssetAdministrationShellResponseDto>(`${this.aasEndpoint}/${id}/shells`)
  }
}
