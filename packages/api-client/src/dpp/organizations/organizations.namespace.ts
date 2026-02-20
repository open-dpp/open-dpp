import type { AxiosInstance } from 'axios'
import type { MemberDto } from './member.dtos'
import type { OrganizationCreateDto, OrganizationDto } from './organization.dtos'

export class OrganizationsNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) { }

  public async getAll() {
    return this.axiosInstance.get<OrganizationDto[]>(`/organizations`)
  }

  public async getById(id: string) {
    return this.axiosInstance.get<OrganizationDto>(`/organizations/${id}`)
  }

  public async getMemberOrganizations() {
    return this.axiosInstance.get<OrganizationDto[]>('/organizations/member')
  }

  public async post(data: OrganizationCreateDto) {
    return this.axiosInstance.post<OrganizationDto>('/organizations', data)
  }

  public async inviteUser(email: string, organizationId: string) {
    return this.axiosInstance.post<OrganizationDto>(
      `/organizations/${organizationId}/invite`,
      { email },
    )
  }

  public async getMembers(organizationId: string) {
    return this.axiosInstance.get<Array<MemberDto>>(
      `/organizations/${organizationId}/members`,
    )
  }

  public async update(id: string, data: { name: string, logo?: string }) {
    return this.axiosInstance.patch<OrganizationDto>(`/organizations/${id}`, data)
  }
}
