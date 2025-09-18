import { defineStore } from 'pinia';
import axiosIns from '../lib/axios';
import { MEDIA_SERVICE_URL } from '../const';
import { MediaInfo } from '../components/media/MediaInfo.interface';
import { ref } from 'vue';

export const useMediaStore = defineStore('media', () => {
  const organizationMedia = ref<Array<MediaInfo>>([]);

  const uploadDppMedia = async (
    organizationId: string | null,
    uuid: string | undefined,
    dataFieldId: string,
    file: File,
    onUploadProgress?: (progress: number) => void,
  ): Promise<string> => {
    if (!organizationId) {
      throw new Error('No organization selected');
    }
    if (!uuid) {
      throw new Error('No UUID provided');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosIns.post(
      `${MEDIA_SERVICE_URL}/media/dpp/${organizationId}/${uuid}/${dataFieldId}`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress) {
            const total = progressEvent.total ?? 1;
            const progress = Math.round((progressEvent.loaded / total) * 100);
            onUploadProgress(progress);
          }
        },
      },
    );

    if (
      response.status === 201 ||
      response.status === 304 ||
      response.status === 200
    ) {
      return (response.data as { mediaId: string }).mediaId;
    }

    throw new Error(`Unexpected upload status ${response.status}`);
  };

  const uploadMedia = async (
    organizationId: string | null,
    file: File,
    onUploadProgress?: (progress: number) => void,
  ): Promise<string> => {
    if (!organizationId) {
      throw new Error('No organization selected');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosIns.post(
      `${MEDIA_SERVICE_URL}/media/${organizationId}`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress) {
            const total = progressEvent.total ?? 1;
            const progress = Math.round((progressEvent.loaded / total) * 100);
            onUploadProgress(progress);
          }
        },
      },
    );

    if (
      response.status === 201 ||
      response.status === 304 ||
      response.status === 200
    ) {
      return (response.data as { mediaId: string }).mediaId;
    }

    throw new Error(`Unexpected upload status ${response.status}`);
  };

  const getDppMediaInfo = async (
    uuid: string | undefined,
    dataFieldId: string,
  ): Promise<MediaInfo> => {
    if (!uuid) {
      throw new Error('No UUID provided');
    }
    const response = await axiosIns.get(
      `${MEDIA_SERVICE_URL}/media/dpp/${uuid}/${dataFieldId}/info`,
    );
    return response.data as MediaInfo;
  };

  const getMediaInfo = async (id: string | undefined): Promise<MediaInfo> => {
    if (!id) {
      throw new Error('No ID provided');
    }
    const response = await axiosIns.get(
      `${MEDIA_SERVICE_URL}/media/${id}/info`,
    );
    return response.data as MediaInfo;
  };

  const downloadDppMedia = async (
    uuid: string | undefined,
    dataFieldId: string,
  ): Promise<Blob> => {
    if (!uuid) {
      throw new Error('No UUID provided');
    }
    const response = await axiosIns.get(
      `${MEDIA_SERVICE_URL}/media/dpp/${uuid}/${dataFieldId}/download`,
      { responseType: 'blob' },
    );
    return response.data as Blob;
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

  const fetchMedia = async (
    id: string,
  ): Promise<{ blob: Blob | null; mediaInfo: MediaInfo }> => {
    const [info, blob] = await Promise.all([
      getMediaInfo(id),
      downloadMedia(id),
    ]);
    return { blob, mediaInfo: info };
  };

  const fetchMediaByOrganizationId = async (
    organizationId: string,
  ): Promise<Array<MediaInfo>> => {
    const response = await axiosIns.get(
      `${MEDIA_SERVICE_URL}/media/by-organization/${organizationId}`,
    );
    const media = response.data as Array<MediaInfo>;
    organizationMedia.value = media;
    return media;
  };

  const downloadMedia = async (id: string): Promise<Blob | null> => {
    try {
      const response = await axiosIns.get(
        `${MEDIA_SERVICE_URL}/media/${id}/download`,
        { responseType: 'blob' },
      );
      if (response.status !== 200) {
        return null;
      }
      return response.data as Blob;
    } catch {
      return null;
    }
  };

  return {
    uploadDppMedia,
    getDppMediaInfo,
    downloadDppMedia,
    fetchDppMedia,
    fetchMediaByOrganizationId,
    downloadMedia,
    getMediaInfo,
    fetchMedia,
    uploadMedia,
    organizationMedia,
  };
});
