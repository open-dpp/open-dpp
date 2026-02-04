import type {
  AssetAdministrationShellPaginationResponseDto,
  PagingParamsDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementPaginationResponseDto,
  SubmodelElementRequestDto,
  SubmodelElementResponseDto,
  SubmodelModificationDto,
  SubmodelPaginationResponseDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
  TableModificationParamsDto,
  ValueRequestDto,
  ValueResponseDto,
} from '@open-dpp/dto'
import type { AxiosInstance, AxiosResponse } from 'axios'

export class AasNamespace {
  private readonly aasEndpoint

  constructor(
    private readonly axiosInstance: AxiosInstance,
    readonly basePath: string,
  ) {
    this.aasEndpoint = `/${basePath}`
  }

  public async getShells(id: string, params: PagingParamsDto) {
    return this.axiosInstance.get<AssetAdministrationShellPaginationResponseDto>(`${this.aasEndpoint}/${id}/shells`, { params })
  }

  public async getSubmodels(id: string, params: PagingParamsDto) {
    return this.axiosInstance.get<SubmodelPaginationResponseDto>(`${this.aasEndpoint}/${id}/submodels`, { params })
  }

  public async getSubmodelById(id: string, submodelId: string) {
    return this.axiosInstance.get<AssetAdministrationShellPaginationResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}`)
  }

  public async deleteSubmodelById(id: string, submodelId: string) {
    return this.axiosInstance.delete(`${this.aasEndpoint}/${id}/submodels/${submodelId}`)
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

  public async deleteSubmodelElementById(id: string, submodelId: string, idShortPath: string) {
    return this.axiosInstance.delete(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}`)
  }

  public async createSubmodel(id: string, data: SubmodelRequestDto) {
    return this.axiosInstance.post<SubmodelResponseDto>(`${this.aasEndpoint}/${id}/submodels`, data)
  }

  public async modifySubmodel(id: string, submodelId: string, data: SubmodelModificationDto) {
    return this.axiosInstance.patch<SubmodelResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}`, data)
  }

  public async createSubmodelElement(id: string, submodelId: string, data: SubmodelElementRequestDto) {
    return this.axiosInstance.post<SubmodelElementResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements`, data)
  }

  public async createSubmodelElementAtIdShortPath(id: string, submodelId: string, idShortPath: string, data: SubmodelElementRequestDto) {
    return this.axiosInstance.post<SubmodelElementResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}`, data)
  }

  public async addColumnToSubmodelElementList(id: string, submodelId: string, idShortPath: string, data: SubmodelElementRequestDto, params: TableModificationParamsDto) {
    return this.axiosInstance.post<SubmodelElementResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/columns`,
      data,
      { params },
    )
  }

  public async modifyColumnOfSubmodelElementList(id: string, submodelId: string, idShortPath: string, idShortOfColumn: string, data: SubmodelElementModificationDto) {
    return this.axiosInstance.patch<SubmodelElementResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/columns/${idShortOfColumn}`,
      data,
    )
  }

  public async deleteColumnFromSubmodelElementList(id: string, submodelId: string, idShortPath: string, idShortOfColumn: string) {
    return this.axiosInstance.delete<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/columns/${idShortOfColumn}`,
    )
  }

  public async addRowToSubmodelElementList(id: string, submodelId: string, idShortPath: string, params: TableModificationParamsDto) {
    return this.axiosInstance.post<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/rows`,
      undefined,
      { params },
    )
  }

  public async deleteRowFromSubmodelElementList(id: string, submodelId: string, idShortPath: string, idShortOfRow: string) {
    return this.axiosInstance.delete<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/rows/${idShortOfRow}`,
    )
  }

  public async modifySubmodelElement(id: string, submodelId: string, idShortPath: string, data: SubmodelElementModificationDto) {
    return this.axiosInstance.patch<SubmodelElementResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}`, data)
  }

  public async modifyValueOfSubmodelElement(id: string, submodelId: string, idShortPath: string, data: ValueRequestDto) {
    return this.axiosInstance.patch<SubmodelElementResponseDto>(`${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/$value`, data)
  }
}
