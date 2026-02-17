import type { AxiosInstance } from 'axios'
import {UserDto} from "@open-dpp/dto";

export class UsersNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) { }

  public async getById(id: string) {
    return this.axiosInstance.get<UserDto>(`/users/${id}`)
  }

  public async create(data: { email: string, name?: string, image?: string }) {
    return this.axiosInstance.post<void>('/users', data)
  }
}
