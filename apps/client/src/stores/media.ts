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

  const getMediaInfo = async (id: string | undefined): Promise<MediaInfo> => {
    if (!id) {
      throw new Error("No ID provided");
    }
    const response = await apiClient.media.media.getMediaInfo(id);
    return response.data;
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

  // ADR 0006 (Design C): public file media is gated through the permalink,
  // so access dies with the permalink — mirrors fetchMedia but routes by-id.
  const fetchPermalinkMedia = async (
    permalinkIdOrSlug: string,
    mediaId: string,
  ): Promise<MediaResult> => {
    const [infoResponse, blobResponse] = await Promise.all([
      apiClient.media.media.getPermalinkMediaInfo(permalinkIdOrSlug, mediaId),
      apiClient.media.media.downloadPermalinkMedia(permalinkIdOrSlug, mediaId),
    ]);
    return { blob: blobResponse.data, mediaInfo: infoResponse.data };
  };

  const fetchMediaByOrganizationId = async (): Promise<Array<MediaInfo>> => {
    const response = await apiClient.media.media.getMediaInfoByOrganization();
    const media = response.data as Array<MediaInfo>;
    organizationMedia.value = media;
    return media;
  };

  const deleteMedia = async (id: string) => {
    return await apiClient.media.media.deleteFile(id);
  };

  return {
    fetchMediaByOrganizationId,
    downloadMedia,
    getMediaInfo,
    fetchMedia,
    fetchPermalinkMedia,
    uploadMedia,
    deleteMedia,
    organizationMedia,
  };
});
