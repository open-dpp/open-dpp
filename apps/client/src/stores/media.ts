import type { MediaInfo, MediaResult } from "../components/media/MediaInfo.interface";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client.ts";

export const useMediaStore = defineStore("media", () => {
  const organizationMedia = ref<Array<MediaInfo>>([]);

  const uploadMedia = async (
    file: File,
    onUploadProgress?: (progress: number) => void,
  ): Promise<string> => {
    return apiClient.media.media.uploadGeneralMedia(file, onUploadProgress);
  };

  const uploadDppMedia = async (
    uuid: string,
    dataFieldId: string,
    file: File,
    onUploadProgress?: (progress: number) => void,
  ): Promise<string> => {
    return apiClient.media.media.uploadDppMedia(uuid, dataFieldId, file, onUploadProgress);
  };

  const getDppMediaInfo = async (
    uuid: string | undefined,
    dataFieldId: string,
  ): Promise<MediaInfo> => {
    if (!uuid) {
      throw new Error("No UUID provided");
    }
    const response = await apiClient.media.media.getMediaInfoOfDataField(uuid, dataFieldId);
    return response.data;
  };

  const getMediaInfo = async (id: string | undefined): Promise<MediaInfo> => {
    if (!id) {
      throw new Error("No ID provided");
    }
    const response = await apiClient.media.media.getMediaInfo(id);
    return response.data;
  };

  const downloadDppMedia = async (uuid: string | undefined, dataFieldId: string): Promise<Blob> => {
    if (!uuid) {
      throw new Error("No UUID provided");
    }
    const response = await apiClient.media.media.downloadMediaOfDataField(uuid, dataFieldId);
    return response.data;
  };

  const fetchDppMedia = async (
    uuid: string | undefined,
    dataFieldId: string,
  ): Promise<{ blob: Blob; mediaInfo: MediaInfo }> => {
    const [info, blob] = await Promise.all([
      getDppMediaInfo(uuid, dataFieldId),
      downloadDppMedia(uuid, dataFieldId),
    ]);
    return { blob, mediaInfo: info };
  };

  const downloadMedia = async (id: string): Promise<Blob | null> => {
    try {
      const response = await apiClient.media.media.download(id);
      if (response.status !== 200) {
        return null;
      }
      return response.data;
    } catch {
      return null;
    }
  };

  const fetchMedia = async (id: string): Promise<MediaResult> => {
    const [info, blob] = await Promise.all([getMediaInfo(id), downloadMedia(id)]);
    return { blob, mediaInfo: info };
  };

  const fetchMediaByOrganizationId = async (): Promise<Array<MediaInfo>> => {
    const response = await apiClient.media.media.getMediaInfoByOrganization();
    const media = response.data as Array<MediaInfo>;
    organizationMedia.value = media;
    return media;
  };

  return {
    getDppMediaInfo,
    downloadDppMedia,
    fetchDppMedia,
    fetchMediaByOrganizationId,
    downloadMedia,
    getMediaInfo,
    fetchMedia,
    uploadMedia,
    uploadDppMedia,
    organizationMedia,
  };
});
