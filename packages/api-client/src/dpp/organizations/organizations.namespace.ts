import type { AxiosInstance } from 'axios'
import type { UserDto } from '../users/user.dtos'
import type { OrganizationCreateDto, OrganizationDto } from './organization.dtos'

export class OrganizationsNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async getAll() {
    return this.axiosInstance.get<OrganizationDto[]>(`/organizations`)
  }

  public async getById(id: string) {
    return this.axiosInstance.get<OrganizationDto>(`/organizations/${id}`)
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
    return this.axiosInstance.get<Array<UserDto>>(
      `/organizations/${organizationId}/members`,
    )
  }
}
