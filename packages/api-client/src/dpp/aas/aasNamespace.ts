import type { AssetAdministrationShellResponseDto } from '@open-dpp/dto'
import type { AxiosInstance } from 'axios'

interface PaginationParams { limit?: number, cursor?: string }

export class AasNamespace {
  private readonly aasEndpoint

  constructor(
    private readonly axiosInstance: AxiosInstance,
    readonly basePath: string,
  ) {
    this.aasEndpoint = `/${basePath}`
  }

  public async getShells(id: string, params: PaginationParams) {
    return this.axiosInstance.get<AssetAdministrationShellResponseDto>(`${this.aasEndpoint}/${id}/shells`, { params })
  }

  public async getSubmodels(id: string, params: PaginationParams) {
    return this.axiosInstance.get<AssetAdministrationShellResponseDto>(`${this.aasEndpoint}/${id}/submodels`, { params })
  }

  public async getSubmodelById(id: string, submodelId: string) {
    return this.axiosInstance.get<AssetAdministrationShellResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}`)
  }
}
