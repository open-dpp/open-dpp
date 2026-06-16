import type { AxiosInstance } from "axios";
import type {
  UniqueProductIdentifierListItemDto,
  UniqueProductIdentifierPaginationDto,
  CreateGs1UniqueProductIdentifierRequest,
  UpdateGs1UniqueProductIdentifierRequest,
} from "./unique-product-identifiers.dtos";

export interface UpiListParams {
  limit?: number;
  cursor?: string;
}

export class UniqueProductIdentifiersNamespace {
  private readonly endpoint = "/unique-product-identifiers";

  constructor(private readonly axiosInstance: AxiosInstance) {}

  // The server returns the standard cursor envelope ({ paging_metadata, result }),
  // matching the sibling Permalink backoffice list.
  public async list(params?: UpiListParams) {
    if (params) {
      return this.axiosInstance.get<UniqueProductIdentifierPaginationDto>(this.endpoint, {
        params,
      });
    }
    return this.axiosInstance.get<UniqueProductIdentifierPaginationDto>(this.endpoint);
  }

  public async getByUuid(uuid: string) {
    return this.axiosInstance.get<UniqueProductIdentifierListItemDto>(
      `${this.endpoint}/${encodeURIComponent(uuid)}`,
    );
  }

  public async create(data: CreateGs1UniqueProductIdentifierRequest) {
    return this.axiosInstance.post(this.endpoint, data);
  }

  public async update(uuid: string, data: UpdateGs1UniqueProductIdentifierRequest) {
    return this.axiosInstance.patch(
      `${this.endpoint}/${encodeURIComponent(uuid)}`,
      data,
    );
  }

  public async delete(uuid: string) {
    return this.axiosInstance.delete<void>(
      `${this.endpoint}/${encodeURIComponent(uuid)}`,
    );
  }
}
