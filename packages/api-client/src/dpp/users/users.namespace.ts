import type { CreateUserDto, InvitationResponseDto, SetUserRoleDto } from "@open-dpp/dto";
import type { AxiosInstance } from "axios";

export class UsersNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async create(data: CreateUserDto) {
    return this.axiosInstance.post<void>("/users", data);
  }

  public async setRole(id: string, data: SetUserRoleDto) {
    return this.axiosInstance.patch<void>(`/users/${id}/role`, data);
  }

  public async getInvitations() {
    return this.axiosInstance.get<InvitationResponseDto[]>("/users/me/invitations");
  }
}
