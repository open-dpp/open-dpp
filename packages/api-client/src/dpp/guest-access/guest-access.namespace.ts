import type {
  CreateGuestAccessDto,
  GuestAccessResponseDto,
  UpdateGuestAccessRoleDto,
} from "@open-dpp/dto";
import type { AxiosInstance } from "axios";

/**
 * Guest access of external people (repairers, authorities, ...) to the data of an organization.
 * Everything except `accept` acts on the active organization and needs an owner.
 */
export class GuestAccessNamespace {
  private readonly basePath = "/guest-accesses";

  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async invite(data: CreateGuestAccessDto) {
    return this.axiosInstance.post<GuestAccessResponseDto>(this.basePath, data);
  }

  public async getAll() {
    return this.axiosInstance.get<GuestAccessResponseDto[]>(this.basePath);
  }

  public async changeRole(id: string, data: UpdateGuestAccessRoleDto) {
    return this.axiosInstance.patch<GuestAccessResponseDto>(
      `${this.basePath}/${encodeURIComponent(id)}/role`,
      data,
    );
  }

  public async revoke(id: string) {
    return this.axiosInstance.post<GuestAccessResponseDto>(
      `${this.basePath}/${encodeURIComponent(id)}/revoke`,
    );
  }

  /** Called by the invited person, who is not a member of the organization. */
  public async accept(id: string) {
    return this.axiosInstance.post<GuestAccessResponseDto>(
      `${this.basePath}/${encodeURIComponent(id)}/accept`,
    );
  }
}
