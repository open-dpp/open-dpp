import type {
  ApiKeyDto,
  ApiKeyPaginationDto,
  CreateApiKeyDto,
  CreatedApiKeyDto,
  CreateUserDto,
  InvitationResponseDto,
  InvitationStatusDtoType,
  MeDto,
  PagingParamsDto,
  RequestEmailChangeDto,
  SetUserRoleDto,
  UpdateApiKeyDto,
  UpdateProfileDto,
  UserDto,
} from "@open-dpp/dto";
import type { AxiosInstance } from "axios";

export class UsersNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async getMe() {
    return this.axiosInstance.get<MeDto>("/users/me");
  }

  public async create(data: CreateUserDto) {
    return this.axiosInstance.post<UserDto>("/users", data);
  }

  public async updateProfile(data: UpdateProfileDto) {
    return this.axiosInstance.patch<MeDto>("/users/me", data);
  }

  public async requestEmailChange(data: RequestEmailChangeDto) {
    return this.axiosInstance.post<MeDto>("/users/me/email-change", data);
  }

  public async cancelEmailChange() {
    return this.axiosInstance.delete<MeDto>("/users/me/email-change");
  }

  public async resendMyVerificationEmail() {
    return this.axiosInstance.post<UserDto>("/users/me/resend-verification-email");
  }

  public async revokeEmailChange(token: string) {
    return this.axiosInstance.post<{ status: "ok" | "invalid" | "error" }>(
      "/users/email-change/revoke",
      { token },
    );
  }

  public async getEmailChangeRevokeInfo(token: string) {
    return this.axiosInstance.get<{ valid: boolean; newEmail?: string }>(
      "/users/email-change/revoke/info",
      { params: { token } },
    );
  }

  public async setRole(id: string, data: SetUserRoleDto) {
    return this.axiosInstance.patch<UserDto>(`/users/${id}/role`, data);
  }

  public async resendPasswordReset(id: string) {
    return this.axiosInstance.post<UserDto>(`/users/${id}/resend-password-reset`);
  }

  public async resendVerificationEmail(id: string) {
    return this.axiosInstance.post<UserDto>(`/users/${id}/resend-verification-email`);
  }

  public async getInvitations(params?: { status: InvitationStatusDtoType }) {
    return this.axiosInstance.get<InvitationResponseDto[]>("/users/me/invitations", { params });
  }

  public async listApiKeys(params?: PagingParamsDto) {
    return this.axiosInstance.get<ApiKeyPaginationDto>("/users/me/api-keys", { params });
  }

  public async createApiKey(data: CreateApiKeyDto) {
    return this.axiosInstance.post<CreatedApiKeyDto>("/users/me/api-keys", data);
  }

  public async updateApiKey(id: string, data: UpdateApiKeyDto) {
    return this.axiosInstance.patch<ApiKeyDto>(
      `/users/me/api-keys/${encodeURIComponent(id)}`,
      data,
    );
  }

  public async deleteApiKey(id: string) {
    return this.axiosInstance.delete<void>(`/users/me/api-keys/${encodeURIComponent(id)}`);
  }
}
