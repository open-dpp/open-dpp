import type { AxiosInstance } from 'axios'
import type {
  UniqueProductIdentifierMetadataDto,
  UniqueProductIdentifierReferenceDto,
} from './unique-product-identifiers.dtos'

export class UniqueProductIdentifiersNamespace {
  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly organizationId?: string,
  ) {}

  public async getReference(uuid: string) {
    return this.axiosInstance.get<UniqueProductIdentifierReferenceDto>(
      `/organizations/${this.organizationId}/unique-product-identifiers/${uuid}/reference`,
    )
  }

  public async getMetadata(uuid: string) {
    return this.axiosInstance.get<UniqueProductIdentifierMetadataDto>(
      `/unique-product-identifiers/${uuid}/metadata`,
    )
  }
}
