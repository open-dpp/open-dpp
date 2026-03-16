import type { AxiosInstance } from 'axios'

export interface InstanceSettingsDto {
  id: string
  signupEnabled: {
    value: boolean
    locked?: boolean
  }
}

export interface PublicInstanceSettingsDto {
  signupEnabled: boolean
}

export class InstanceSettingsNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async get() {
    return this.axiosInstance.get<InstanceSettingsDto>('/instance-settings')
  }

  public async update(data: { signupEnabled?: boolean }) {
    return this.axiosInstance.patch<InstanceSettingsDto>('/instance-settings', data)
  }

  public async getPublic() {
    return this.axiosInstance.get<PublicInstanceSettingsDto>('/instance-settings/public')
  }
}
