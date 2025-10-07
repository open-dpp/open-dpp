import type { AxiosInstance } from 'axios'
import type { ProductPassportDto } from './product-passport.dtos'

export class ProductPassportsNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async getById(uuid: string) {
    return this.axiosInstance.get<ProductPassportDto>(
      `/product-passports/${uuid}`,
    )
  }
}
