import type {
  PagingParamsDto,
  TemplatePaginationDto,
} from '@open-dpp/dto'
import type { AxiosInstance } from 'axios'

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
}
