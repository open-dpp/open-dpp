import type { AxiosInstance } from 'axios'
import type { PassportTemplateGetAllDto } from './passport-templates.dtos'

export class PassportTemplatesNamespace {
  private readonly templatesEndpoint: string = '/templates/passports'
  constructor(public readonly axiosInstance: AxiosInstance) {}

  public async getAll() {
    return this.axiosInstance.get<PassportTemplateGetAllDto[]>(
      this.templatesEndpoint,
    )
  }
}
