import type { PassportDto } from '@open-dpp/dto'
import type { AxiosInstance } from 'axios'
import type {
  UniqueProductIdentifierDto,
  UniqueProductIdentifierMetadataDto,
  UniqueProductIdentifierReferenceDto,
} from './unique-product-identifiers.dtos'
import { AasNamespace } from '../aas/aasNamespace'

export class UniqueProductIdentifiersNamespace {
  public aas!: AasNamespace

  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly organizationId?: string,
  ) {
    this.aas = new AasNamespace(this.axiosInstance, 'unique-product-identifiers')
  }

  public async getReference(uuid: string) {
    return this.axiosInstance.get<UniqueProductIdentifierReferenceDto>(
      `/organizations/${this.organizationId}/unique-product-identifiers/${uuid}/reference`,
    )
  }

  public async getByReference(reference: string) {
    return this.axiosInstance.get<UniqueProductIdentifierDto[]>(
      `/organizations/${this.organizationId}/unique-product-identifiers?reference=${reference}`,
    )
  }

  public async getPassport(uuid: string) {
    return this.axiosInstance.get<PassportDto>(
      `/organizations/${this.organizationId}/unique-product-identifiers/${uuid}/passport`,
    )
  }

  public async getMetadata(uuid: string) {
    return this.axiosInstance.get<UniqueProductIdentifierMetadataDto>(
      `/unique-product-identifiers/${uuid}/metadata`,
    )
  }
}
