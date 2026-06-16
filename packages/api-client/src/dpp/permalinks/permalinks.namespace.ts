import type {
  PassportPermalinkBundleDto,
  PermalinkCreateRequest,
  PermalinkPaginationDto,
  PermalinkPublicDto,
  PermalinkUpdateRequest,
} from "@open-dpp/dto";
import type { AxiosInstance } from "axios";
import { AasNamespace } from "../aas/aasNamespace";

export interface PermalinkListParams {
  limit?: number;
  cursor?: string;
}

export class PermalinksNamespace {
  public aas!: AasNamespace;

  private readonly backofficeEndpoint = "/permalinks";

  constructor(private readonly axiosInstance: AxiosInstance) {
    this.aas = new AasNamespace(this.axiosInstance, "p");
  }

  // ─── Public resolver methods ────────────────────────────────────────────────

  public async getByPassport(passportId: string) {
    return this.axiosInstance.get<PermalinkPublicDto[]>(
      `/p?passportId=${encodeURIComponent(passportId)}`,
    );
  }

  public async getById(idOrSlug: string) {
    return this.axiosInstance.get<PassportPermalinkBundleDto>(`/p/${encodeURIComponent(idOrSlug)}`);
  }

  /**
   * @deprecated Use `updateByResolver` instead. Renamed to avoid collision with `updateById`.
   */
  public async update(id: string, body: PermalinkUpdateRequest) {
    return this.updateByResolver(id, body);
  }

  public async updateByResolver(id: string, body: PermalinkUpdateRequest) {
    return this.axiosInstance.patch<PermalinkPublicDto>(`/p/${encodeURIComponent(id)}`, body);
  }

  // ─── Backoffice CRUD methods ─────────────────────────────────────────────────

  // The org-scoped backoffice list returns the standard cursor envelope
  // ({ paging_metadata, result }). The public `/p` resolver methods above still
  // return bare arrays.
  public async list(params?: PermalinkListParams) {
    if (params) {
      return this.axiosInstance.get<PermalinkPaginationDto>(this.backofficeEndpoint, { params });
    }
    return this.axiosInstance.get<PermalinkPaginationDto>(this.backofficeEndpoint);
  }

  public async create(data: PermalinkCreateRequest) {
    return this.axiosInstance.post<PermalinkPublicDto>(this.backofficeEndpoint, data);
  }

  public async updateById(id: string, data: PermalinkUpdateRequest) {
    return this.axiosInstance.patch<PermalinkPublicDto>(
      `${this.backofficeEndpoint}/${encodeURIComponent(id)}`,
      data,
    );
  }

  public async delete(id: string) {
    return this.axiosInstance.delete<void>(
      `${this.backofficeEndpoint}/${encodeURIComponent(id)}`,
    );
  }

  public async setPrimary(id: string) {
    return this.axiosInstance.post<void>(
      `${this.backofficeEndpoint}/${encodeURIComponent(id)}/primary`,
    );
  }
}
