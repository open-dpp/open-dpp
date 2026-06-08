import type { AxiosInstance } from "axios";
import type { MemberDto } from "./member.dtos";
import type { OrganizationCreateDto, OrganizationDto } from "./organization.dtos";
import type { InvitationResponseDto, MemberRoleDtoType } from "@open-dpp/dto";

export class OrganizationsNamespace {
  private basePath = "/organizations";

  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async getAll() {
    return this.axiosInstance.get<OrganizationDto[]>(`${this.basePath}`);
  }

  public async getById(id: string) {
    return this.axiosInstance.get<OrganizationDto>(`${this.basePath}/${id}`);
  }

  public async getMemberOrganizations() {
    return this.axiosInstance.get<OrganizationDto[]>("${this.basePath}/member");
  }

  public async post(data: OrganizationCreateDto) {
    return this.axiosInstance.post<OrganizationDto>("${this.basePath}", data);
  }

  public async inviteUser(email: string, organizationId: string) {
    return this.axiosInstance.post<OrganizationDto>(`${this.basePath}/${organizationId}/invite`, {
      email,
    });
  }

  public async getInvitation(id: string) {
    return this.axiosInstance.get<InvitationResponseDto>(`${this.basePath}/invitations/${id}`);
  }

  public async getMembers(organizationId: string) {
    return this.axiosInstance.get<Array<MemberDto>>(`${this.basePath}/${organizationId}/members`);
  }

  public async update(id: string, data: { name: string; logo?: string }) {
    return this.axiosInstance.patch<OrganizationDto>(`${this.basePath}/${id}`, data);
  }

  public async changeMemberRole(memberId: string, role: MemberRoleDtoType) {
    return this.axiosInstance.patch<void>(`${this.basePath}/member/${memberId}/role`, { role });
  }
}
