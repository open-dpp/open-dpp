import type { AxiosInstance } from 'axios'
import type { UserDto } from './user.dtos'

export class UsersNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) { }

  public async getById(id: string) {
    return this.axiosInstance.get<UserDto>(`/users/${id}`)
  }

  public async create(data: { email: string, name?: string, image?: string }) {
    return this.axiosInstance.post<void>('/users', data)
  }
}
