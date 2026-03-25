import type { CreateUserDto, SetUserRoleDto, UserDto } from '@open-dpp/dto'
import type { AxiosInstance } from 'axios'

export class UsersNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) { }

  public async getById(id: string) {
    return this.axiosInstance.get<UserDto>(`/users/${id}`)
  }

  public async create(data: CreateUserDto) {
    return this.axiosInstance.post<void>('/users', data)
  }

  public async setRole(id: string, data: SetUserRoleDto) {
    return this.axiosInstance.patch<void>(`/users/${id}/role`, data)
  }
}
