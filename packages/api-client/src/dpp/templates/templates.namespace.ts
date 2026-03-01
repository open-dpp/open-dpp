import type {
  PagingParamsDto,
  TemplateDto,
  TemplatePaginationDto,
} from '@open-dpp/dto'
import type { AxiosInstance, AxiosResponse } from 'axios'

import { AasNamespace } from '../aas/aasNamespace'

export class TemplatesNamespace {
  public aas!: AasNamespace
  private readonly templatesEndpoint = '/templates'

  constructor(
    private readonly axiosInstance: AxiosInstance,
  ) {
    this.aas = new AasNamespace(this.axiosInstance, 'templates')
  }

  public async getAll(params: PagingParamsDto) {
    return await this.axiosInstance.get<TemplatePaginationDto>(this.templatesEndpoint, { params })
  }

  public async create(): Promise<AxiosResponse<TemplateDto>> {
    return await this.axiosInstance.post<TemplateDto>(this.templatesEndpoint)
  }

  public async export(id: string) {
    return await this.axiosInstance.get<Record<string, unknown>>(`${this.templatesEndpoint}/${id}/export`)
  }

  public async import(data: Record<string, unknown>): Promise<AxiosResponse<TemplateDto>> {
    return await this.axiosInstance.post<TemplateDto>(`${this.templatesEndpoint}/import`, data)
  }
}
