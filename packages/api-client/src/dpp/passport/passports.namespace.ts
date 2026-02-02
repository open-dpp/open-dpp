import type {
  PagingParamsDto,
  PassportDto,
  PassportPaginationDto,
  PassportRequestCreateDto,
} from '@open-dpp/dto'
import type { AxiosInstance, AxiosResponse } from 'axios'

import { AasNamespace } from '../aas/aasNamespace'

export class PassportNamespace {
  public aas!: AasNamespace
  private readonly passportEndpoint = '/passports'

  constructor(
    private readonly axiosInstance: AxiosInstance,
  ) {
    this.aas = new AasNamespace(this.axiosInstance, 'passports')
  }

  public async getAll(params: PagingParamsDto) {
    return await this.axiosInstance.get<PassportPaginationDto>(this.passportEndpoint, { params })
  }

  public async create(params: PassportRequestCreateDto): Promise<AxiosResponse<PassportDto>> {
    return await this.axiosInstance.post<PassportDto>(this.passportEndpoint, params)
  }
}
