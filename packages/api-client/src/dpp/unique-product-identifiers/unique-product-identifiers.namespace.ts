import type { AxiosInstance } from "axios";
import type {
  UniqueProductIdentifierListItemDto,
  UniqueProductIdentifierPaginationDto,
  CreateGs1UniqueProductIdentifierRequest,
  CreateInternalUniqueProductIdentifierRequest,
  UpdateGs1UniqueProductIdentifierRequest,
} from "./unique-product-identifiers.dtos";
import type { CursorListParams } from "../cursor-list-params";

export class UniqueProductIdentifiersNamespace {
  private readonly endpoint = "/unique-product-identifiers";

  constructor(private readonly axiosInstance: AxiosInstance) {}

  // The server returns the standard cursor envelope ({ paging_metadata, result }),
  // matching the sibling Permalink backoffice list.
  public async list(params?: CursorListParams) {
    return this.axiosInstance.get<UniqueProductIdentifierPaginationDto>(this.endpoint, {
      params,
    });
  }

  public async getByUuid(uuid: string) {
    return this.axiosInstance.get<UniqueProductIdentifierListItemDto>(
      `${this.endpoint}/${encodeURIComponent(uuid)}`,
    );
  }

  public async create(data: CreateGs1UniqueProductIdentifierRequest) {
    return this.axiosInstance.post(this.endpoint, data);
  }

  // Create an internal (OPEN_DPP_UUID) UPI — the server mints its uuid; no identity
  // payload. Returns the created list-item snapshot. See ADR 0005.
  public async createInternal(data: CreateInternalUniqueProductIdentifierRequest) {
    return this.axiosInstance.post<UniqueProductIdentifierListItemDto>(
      `${this.endpoint}/internal`,
      data,
    );
  }

  public async update(uuid: string, data: UpdateGs1UniqueProductIdentifierRequest) {
    return this.axiosInstance.patch(`${this.endpoint}/${encodeURIComponent(uuid)}`, data);
  }

  public async delete(uuid: string) {
    return this.axiosInstance.delete<void>(`${this.endpoint}/${encodeURIComponent(uuid)}`);
  }
}
