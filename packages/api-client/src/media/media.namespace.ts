import type { AxiosInstance } from 'axios'
import type { MediaInfoDto } from './media.dtos'

export class MediaNamespace {
  private readonly mediaEndpoint: string
  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly organizationId?: string,
  ) {
    this.mediaEndpoint = `/media`
  }

  async download(id: string) {
    return this.axiosInstance.get<Blob>(
      `${this.mediaEndpoint}/${id}/download`,
      {
        responseType: 'blob',
      },
    )
  }

  async downloadMediaOfDataField(uuid: string, dataFieldId: string) {
    return await this.axiosInstance.get<Blob>(
      `${this.mediaEndpoint}/dpp/${uuid}/${dataFieldId}/download`,
      { responseType: 'blob' },
    )
  }

  async getMediaInfo(id: string) {
    return this.axiosInstance.get<MediaInfoDto>(
      `${this.mediaEndpoint}/${id}/info`,
    )
  }

  async getMediaInfoByOrganization() {
    return this.axiosInstance.get<MediaInfoDto[]>(
      `${this.mediaEndpoint}/by-organization/${this.organizationId}`,
    )
  }

  async getMediaInfoOfDataField(uuid: string, dataFieldId: string) {
    return this.axiosInstance.get<MediaInfoDto>(
      `${this.mediaEndpoint}/dpp/${uuid}/${dataFieldId}/info`,
    )
  }
}
