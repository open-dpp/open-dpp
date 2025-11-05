import type { AxiosInstance } from 'axios'
import type { DataValueDto } from '../passport-data/data-value.dto'
import type { MediaReferenceDto, MediaReferencePositionDto, ModelCreateDto, ModelDto } from './model.dtos'

export class ModelsNamespace {
  private readonly modelsEndpoint: string
  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly organizationId?: string,
  ) {
    this.modelsEndpoint = `/organizations/${this.organizationId}/models`
  }

  public async create(data: ModelCreateDto) {
    return this.axiosInstance.post<ModelDto>(this.modelsEndpoint, data)
  }

  public async addData(modelId: string, data: DataValueDto[]) {
    return this.axiosInstance.post<ModelDto>(
      `${this.modelsEndpoint}/${modelId}/data-values`,
      data,
    )
  }

  public async addMediaReference(modelId: string, data: MediaReferenceDto) {
    return this.axiosInstance.post<ModelDto>(
      `${this.modelsEndpoint}/${modelId}/media`,
      data,
    )
  }

  public async deleteMediaReference(modelId: string, mediaId: string) {
    return this.axiosInstance.delete<ModelDto>(
      `${this.modelsEndpoint}/${modelId}/media/${mediaId}`,
    )
  }

  public async modifyMediaReference(modelId: string, mediaId: string, data: MediaReferenceDto) {
    return this.axiosInstance.patch<ModelDto>(
      `${this.modelsEndpoint}/${modelId}/media/${mediaId}`,
      data,
    )
  }

  public async moveMediaReference(modelId: string, mediaId: string, data: MediaReferencePositionDto) {
    return this.axiosInstance.patch<ModelDto>(
      `${this.modelsEndpoint}/${modelId}/media/${mediaId}/move`,
      data,
    )
  }

  public async modifyData(modelId: string, data: DataValueDto[]) {
    return this.axiosInstance.patch<ModelDto>(
      `${this.modelsEndpoint}/${modelId}/data-values`,
      data,
    )
  }

  public async getAll() {
    return this.axiosInstance.get<ModelDto[]>(this.modelsEndpoint)
  }

  public async getById(id: string) {
    return this.axiosInstance.get<ModelDto>(`${this.modelsEndpoint}/${id}`)
  }
}
