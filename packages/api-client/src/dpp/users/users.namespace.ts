import type {
  CreateUserDto,
  MeDto,
  SetUserRoleDto,
  UpdateProfileDto,
  UserDto,
} from "@open-dpp/dto";
import type { AxiosInstance } from "axios";

export class UsersNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async getById(id: string) {
    return this.axiosInstance.get<UserDto>(`/users/${id}`);
  }

  public async getMe() {
    return this.axiosInstance.get<MeDto>("/users/me");
  }

  public async create(data: CreateUserDto) {
    return this.axiosInstance.post<void>("/users", data);
  }

  public async updateProfile(data: UpdateProfileDto) {
    return this.axiosInstance.patch<MeDto>("/users/me", data);
  }

  public async requestEmailChange(data: { newEmail: string; currentPassword: string }) {
    return this.axiosInstance.post<MeDto>("/users/me/email-change", data);
  }

  public async cancelEmailChange() {
    return this.axiosInstance.delete<MeDto>("/users/me/email-change");
  }

  public async setRole(id: string, data: SetUserRoleDto) {
    return this.axiosInstance.patch<void>(`/users/${id}/role`, data);
  }
}
