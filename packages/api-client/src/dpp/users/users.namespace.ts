import type { UserDto } from '@open-dpp/dto'
import type { AxiosInstance } from 'axios'

export class UsersNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) { }

  public async getById(id: string) {
    return this.axiosInstance.get<UserDto>(`/users/${id}`)
  }

  public async create(data: { email: string, firstName?: string, lastName?: string }) {
    return this.axiosInstance.post<void>('/users', data)
  }
}
