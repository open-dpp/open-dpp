import type { AxiosInstance } from "axios";
import type { MediaInfoDto } from "./media.dtos";

export class MediaNamespace {
  private readonly mediaEndpoint = `/media`;
  constructor(private readonly axiosInstance: AxiosInstance) {}

  async download(id: string) {
    return this.axiosInstance.get<Blob>(`${this.mediaEndpoint}/${id}/download`, {
      responseType: "blob",
    });
  }

  async downloadMediaOfDataField(uuid: string, dataFieldId: string) {
    return await this.axiosInstance.get<Blob>(
      `${this.mediaEndpoint}/dpp/${uuid}/${dataFieldId}/download`,
      { responseType: "blob" },
    );
  }

  async getMediaInfo(id: string) {
    return this.axiosInstance.get<MediaInfoDto>(`${this.mediaEndpoint}/${id}/info`);
  }

  async getMediaInfoByOrganization() {
    return this.axiosInstance.get<MediaInfoDto[]>(`${this.mediaEndpoint}/by-organization`);
  }

  async getMediaInfoOfDataField(uuid: string, dataFieldId: string) {
    return this.axiosInstance.get<MediaInfoDto>(
      `${this.mediaEndpoint}/dpp/${uuid}/${dataFieldId}/info`,
    );
  }

  async uploadOrganizationProfileMedia(
    file: File,
    onUploadProgress?: (progress: number) => void,
  ): Promise<string> {
    const url = `${this.mediaEndpoint}/organization-profile`;
    return this.uploadMedia(url, file, onUploadProgress);
  }

  async uploadDppMedia(
    uuid: string,
    dataFieldId: string,
    file: File,
    onUploadProgress?: (progress: number) => void,
  ): Promise<string> {
    const url = `${this.mediaEndpoint}/dpp/${uuid}/${dataFieldId}`;
    return this.uploadMedia(url, file, onUploadProgress);
  }

  async uploadGeneralMedia(
    file: File,
    onUploadProgress?: (progress: number) => void,
  ): Promise<string> {
    const url = `${this.mediaEndpoint}/upload`;
    return this.uploadMedia(url, file, onUploadProgress);
  }

  async uploadMedia(
    url: string,
    file: File,
    onUploadProgress?: (progress: number) => void,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await this.axiosInstance.post(url, formData, {
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const total = progressEvent.total ?? 1;
          const progress = Math.round((progressEvent.loaded / total) * 100);
          onUploadProgress(progress);
        }
      },
    });

    if (response.status === 201 || response.status === 304 || response.status === 200) {
      return (response.data as { mediaId: string }).mediaId;
    }

    throw new Error(`Unexpected upload status ${response.status}`);
  }
}
