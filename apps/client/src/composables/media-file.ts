import type { MaybeRefOrGetter } from "vue";
import type { MediaInfo, MediaResult } from "../components/media/MediaInfo.interface.ts";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import { onUnmounted, ref, toValue } from "vue";
import { useMediaStore } from "../stores/media.ts";

/**
 * Fetch a media's info and bytes. With a permalink (public passport page) the permalink-gated
 * route is used, so access ends with the permalink; without one, the authenticated bare route.
 */
function fetchMediaResult(
  mediaStore: ReturnType<typeof useMediaStore>,
  mediaId: string,
  permalinkIdOrSlug: string | undefined,
): Promise<MediaResult> {
  return permalinkIdOrSlug
    ? mediaStore.fetchPermalinkMedia(permalinkIdOrSlug, mediaId)
    : mediaStore.fetchMedia(mediaId);
}

export function useMediaFile() {
  const mediaInfo = ref<MediaInfo | null>(null);
  const fileUrl = ref<string | null>(null);
  const mediaStore = useMediaStore();
  const notFound = ref(false);

  async function download(mediaId: string, permalinkIdOrSlug?: string) {
    try {
      if (fileUrl.value) {
        URL.revokeObjectURL(fileUrl.value);
      }
      const { blob, mediaInfo: fetchedMediaInfo } = await fetchMediaResult(
        mediaStore,
        mediaId,
        permalinkIdOrSlug,
      );

      if (blob) {
        fileUrl.value = URL.createObjectURL(blob);
      }
      mediaInfo.value = fetchedMediaInfo;
    } catch {
      fileUrl.value = null;
      mediaInfo.value = null;
      notFound.value = true;
    }
  }

  onUnmounted(() => {
    if (fileUrl.value) {
      URL.revokeObjectURL(fileUrl.value);
    }
  });
  return { download, mediaInfo, fileUrl, notFound };
}

export interface MediaFileCollectionItem {
  blob: Blob | null;
  mediaInfo: MediaInfo;
  url: string;
  deleted: boolean;
}

export interface MediaFileCollectionProps {
  errorHandlingStore: IErrorHandlingStore;
  translate: (label: string, ...args: unknown[]) => string;
  /**
   * Set on the public passport page: media is then fetched through the permalink-gated route.
   * Read lazily on every fetch, so a getter/ref may resolve after the composable is created.
   */
  permalinkIdOrSlug?: MaybeRefOrGetter<string | undefined>;
}

export function useMediaFileCollection({
  errorHandlingStore,
  translate,
  permalinkIdOrSlug,
}: MediaFileCollectionProps) {
  const files = ref<MediaFileCollectionItem[]>([]);
  const mediaStore = useMediaStore();

  async function download(mediaIds: string[]) {
    try {
      removeAll();
      for (const mediaId of mediaIds) {
        await add(mediaId);
      }
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(translate("file.downloadError"), error);
    }
  }

  async function add(mediaId: string, position?: number) {
    const errorMsg = translate("file.couldNotBeLoaded");
    if (files.value.some((file) => file.mediaInfo.id === mediaId)) {
      return false;
    }
    try {
      const { blob, mediaInfo: fetchedMediaInfo } = await fetchMediaResult(
        mediaStore,
        mediaId,
        toValue(permalinkIdOrSlug),
      );
      if (blob) {
        const newMedia = {
          blob,
          mediaInfo: fetchedMediaInfo,
          url: URL.createObjectURL(blob),
          deleted: false,
        };

        if (position !== undefined && position >= 0 && position < files.value.length) {
          if (files.value[position]) {
            URL.revokeObjectURL(files.value[position].url);
          }
          files.value[position] = newMedia;
        } else {
          files.value.push(newMedia);
        }
        return true;
      } else {
        errorHandlingStore.logErrorWithNotification(errorMsg);
      }
    } catch {
      files.value.push({
        blob: null,
        mediaInfo: {
          id: mediaId,
          mimeType: "NaN",
          size: 0,
          title: "deleted file",
        },
        deleted: true,
        url: "",
      });
    }
    return false;
  }

  function remove(mediaId: string) {
    const foundIndex = files.value.findIndex((file) => file.mediaInfo.id === mediaId);
    if (foundIndex !== -1) {
      if (files.value[foundIndex]) {
        URL.revokeObjectURL(files.value[foundIndex].url);
      }
      files.value.splice(foundIndex, 1);
    }
  }

  function move(mediaId: string, newIndex: number) {
    const foundIndex = files.value.findIndex((file) => file.mediaInfo.id === mediaId);
    if (foundIndex !== -1) {
      const media = files.value.splice(foundIndex, 1)[0];
      if (media) {
        files.value.splice(newIndex, 0, media);
      }
    }
  }

  async function modify(oldMediaId: string, newMediaId: string) {
    const foundIndex = files.value.findIndex((file) => file.mediaInfo.id === oldMediaId);
    if (foundIndex === -1) {
      return;
    }
    await add(newMediaId, foundIndex);
  }

  function removeAll() {
    for (const file of files.value) {
      URL.revokeObjectURL(file.url);
    }
    files.value = [];
  }

  onUnmounted(() => {
    removeAll();
  });
  return { download, files, remove, add, move, modify };
}
