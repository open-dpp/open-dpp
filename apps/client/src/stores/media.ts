import type { PagingParamsDto } from "@open-dpp/dto";
import type { MediaInfo, MediaResult } from "../components/media/MediaInfo.interface";
import { isEqual } from "lodash";
import { defineStore } from "pinia";
import { ref } from "vue";
import { usePagination } from "../composables/pagination.ts";
import apiClient from "../lib/api-client.ts";

/** How many media of the organization the media library and the media picker show at a time. */
export const ORGANIZATION_MEDIA_PAGE_SIZE = 6;

/**
 * The fetched media, with the object that is already loaded for each one whose info is unchanged.
 * An entry that stays the same object gives its preview no reason to request the file again.
 */
function keepLoadedMedia(loaded: Array<MediaInfo>, fetched: Array<MediaInfo>): Array<MediaInfo> {
  const loadedById = new Map(loaded.map((media) => [media.id, media]));
  return fetched.map((media) => {
    const known = loadedById.get(media.id);
    return known && isEqual(known, media) ? known : media;
  });
}

export const useMediaStore = defineStore("media", () => {
  /** The page of the organization's media that is shown, newest first. */
  const organizationMedia = ref<Array<MediaInfo>>([]);

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

  const fetchOrganizationMediaPage = async (pagingParams: PagingParamsDto) => {
    const response = await apiClient.media.media.getMediaInfoByOrganization(pagingParams);
    organizationMedia.value = keepLoadedMedia(organizationMedia.value, response.data.result);
    return response.data;
  };

  const organizationMediaPaging = usePagination({
    limit: ORGANIZATION_MEDIA_PAGE_SIZE,
    fetchCallback: fetchOrganizationMediaPage,
    // The page is not part of the URL: the media picker opens on top of other pages
    changeQueryParams: () => {},
  });

  /**
   * Shows the first page in a grid that opens. The files of a later page that an earlier grid
   * was left on are dropped first, so the new grid neither shows them nor requests their previews
   * while the first page is on its way.
   */
  const openOrganizationMedia = async () => {
    if (organizationMediaPaging.hasPrevious.value) {
      organizationMedia.value = [];
    }
    await organizationMediaPaging.resetCursor();
  };

  /**
   * Loads the shown page again, for example after one of its files was deleted. When the page
   * has no file left, the page before it is shown.
   */
  const reloadOrganizationMediaPage = async () => {
    await organizationMediaPaging.reloadCurrentPage();
    if (organizationMedia.value.length === 0 && organizationMediaPaging.hasPrevious.value) {
      await organizationMediaPaging.previousPage();
    }
  };

  const deleteMedia = async (id: string) => {
    return await apiClient.media.media.deleteFile(id);
  };

  return {
    getDppMediaInfo,
    downloadDppMedia,
    fetchDppMedia,
    openOrganizationMedia,
    showFirstOrganizationMediaPage: organizationMediaPaging.resetCursor,
    showNextOrganizationMediaPage: organizationMediaPaging.nextPage,
    showPreviousOrganizationMediaPage: organizationMediaPaging.previousPage,
    reloadOrganizationMediaPage,
    organizationMediaPage: organizationMediaPaging.currentPage,
    organizationMediaTotal: organizationMediaPaging.totalCount,
    hasNextOrganizationMediaPage: organizationMediaPaging.hasNext,
    hasPreviousOrganizationMediaPage: organizationMediaPaging.hasPrevious,
    downloadMedia,
    getMediaInfo,
    fetchMedia,
    deleteMedia,
    organizationMedia,
  };
});
