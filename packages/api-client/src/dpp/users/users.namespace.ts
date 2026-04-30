import type {
  CreateUserDto,
  RequestEmailChangeDto,
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
    return this.axiosInstance.get<UserDto>("/users/me");
  }

  public async create(data: CreateUserDto) {
    return this.axiosInstance.post<void>("/users", data);
  }

  public async updateProfile(data: UpdateProfileDto) {
    return this.axiosInstance.patch<UserDto>("/users/me", data);
  }

  public async requestEmailChange(data: RequestEmailChangeDto) {
    return this.axiosInstance.post<void>("/users/me/email-change", data);
  }

  public async setRole(id: string, data: SetUserRoleDto) {
    return this.axiosInstance.patch<void>(`/users/${id}/role`, data);
  }
}
