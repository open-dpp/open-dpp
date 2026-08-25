import type {
  PassportPermalinkBundleDto,
  PermalinkCreateRequest,
  PermalinkPaginationDto,
  PermalinkPublicDto,
  PermalinkUpdateRequest,
} from "@open-dpp/dto";
import type { AxiosInstance } from "axios";
import { AasNamespace } from "../aas/aasNamespace";
import type { CursorListParams } from "../cursor-list-params";

export class PermalinksNamespace {
  public aas!: AasNamespace;

  private readonly backofficeEndpoint = "/permalinks";

  constructor(private readonly axiosInstance: AxiosInstance) {
    this.aas = new AasNamespace(this.axiosInstance, "p");
  }

  public async getByPassport(passportId: string) {
    return this.axiosInstance.get<PermalinkPublicDto[]>(
      `/p?passportId=${encodeURIComponent(passportId)}`,
    );
  }

  public async getById(idOrSlug: string) {
    return this.axiosInstance.get<PassportPermalinkBundleDto>(`/p/${encodeURIComponent(idOrSlug)}`);
  }

  public async updateByResolver(id: string, body: PermalinkUpdateRequest) {
    return this.axiosInstance.patch<PermalinkPublicDto>(`/p/${encodeURIComponent(id)}`, body);
  }

  public async list(params?: CursorListParams) {
    return this.axiosInstance.get<PermalinkPaginationDto>(this.backofficeEndpoint, { params });
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
    return this.axiosInstance.delete<void>(`${this.backofficeEndpoint}/${encodeURIComponent(id)}`);
  }
}
