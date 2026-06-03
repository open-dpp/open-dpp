import type {
  PassportPermalinkBundleDto,
  PermalinkPublicDto,
  PermalinkUpdateRequest,
} from "@open-dpp/dto";
import type { AxiosInstance } from "axios";
import { AasNamespace } from "../aas/aasNamespace";

export class PermalinksNamespace {
  public aas!: AasNamespace;

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

  public async update(id: string, body: PermalinkUpdateRequest) {
    return this.axiosInstance.patch<PermalinkPublicDto>(`/p/${encodeURIComponent(id)}`, body);
  }
}
