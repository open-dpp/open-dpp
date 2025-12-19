import type {
  AssetAdministrationShellPaginationResponseDto,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
} from '@open-dpp/dto'
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
    return this.axiosInstance.get<AssetAdministrationShellPaginationResponseDto>(`${this.aasEndpoint}/${id}/shells`, { params })
  }

  public async getSubmodels(id: string, params: PaginationParams) {
    return this.axiosInstance.get<SubmodelPaginationResponseDto>(`${this.aasEndpoint}/${id}/submodels`, { params })
  }

  public async getSubmodelById(id: string, submodelId: string) {
    return this.axiosInstance.get<AssetAdministrationShellPaginationResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}`)
  }

  public async getSubmodelElements(id: string, submodelId: string) {
    return this.axiosInstance.get<SubmodelElementPaginationResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements`)
  }

  public async getSubmodelElementById(id: string, submodelId: string, idShortPath: string) {
    return this.axiosInstance.get<SubmodelElementResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}`)
  }
}
