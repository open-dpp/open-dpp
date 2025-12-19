import type {
  AssetAdministrationShellPaginationResponseDto,
  SubmodelElementPaginationResponseDto,
  SubmodelElementRequestDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from '@open-dpp/dto'
import type { AxiosInstance, AxiosResponse } from 'axios'

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

  public async getSubmodelValue(id: string, submodelId: string): Promise<AxiosResponse<ValueResponseDto>> {
    return this.axiosInstance.get<ValueResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/$value`)
  }

  public async getSubmodelElements(id: string, submodelId: string) {
    return this.axiosInstance.get<SubmodelElementPaginationResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements`)
  }

  public async getSubmodelElementValue(id: string, submodelId: string, idShortPath: string): Promise<AxiosResponse<ValueResponseDto>> {
    return this.axiosInstance.get<ValueResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/$value`)
  }

  public async getSubmodelElementById(id: string, submodelId: string, idShortPath: string) {
    return this.axiosInstance.get<SubmodelElementResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}`)
  }

  public async createSubmodel(id: string, data: SubmodelRequestDto) {
    return this.axiosInstance.post<SubmodelResponseDto>(`${this.aasEndpoint}/${id}/submodels`, data)
  }

  public async createSubmodelElement(id: string, submodelId: string, data: SubmodelElementRequestDto) {
    return this.axiosInstance.post<SubmodelElementResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements`, data)
  }
}
