import type { AxiosInstance } from 'axios'
import type { DataValueDto } from '../passport-data/data-value.dto'
import type { ItemDto } from './item.dtos'

export class ItemsNamespace {
  private readonly modelsEndpoint: string
  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly organizationId?: string,
  ) {
    this.modelsEndpoint = `/organizations/${this.organizationId}/models`
  }

  public async create(modelId: string) {
    return this.axiosInstance.post<ItemDto>(
      `${this.modelsEndpoint}/${modelId}/items`,
    )
  }

  public async getAll(modelId: string) {
    return this.axiosInstance.get<ItemDto[]>(
      `${this.modelsEndpoint}/${modelId}/items`,
    )
  }

  public async getById(modelId: string, itemId: string) {
    return this.axiosInstance.get<ItemDto>(
      `${this.modelsEndpoint}/${modelId}/items/${itemId}`,
    )
  }

  public async addData(modelId: string, itemId: string, data: DataValueDto[]) {
    return this.axiosInstance.post<ItemDto>(
      `${this.modelsEndpoint}/${modelId}/items/${itemId}/data-values`,
      data,
    )
  }

  public async modifyData(
    modelId: string,
    itemId: string,
    data: DataValueDto[],
  ) {
    return this.axiosInstance.patch<ItemDto>(
      `${this.modelsEndpoint}/${modelId}/items/${itemId}/data-values`,
      data,
    )
  }
}
