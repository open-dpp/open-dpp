import type { MediaInfo } from "../components/media/MediaInfo.interface.ts";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import { onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {

  useErrorHandlingStore,
} from "../stores/error.handling.ts";
import { useMediaStore } from "../stores/media.ts";

export function useMediaFile() {
  const mediaInfo = ref<MediaInfo | null>(null);
  const fileUrl = ref<string | null>(null);
  const mediaStore = useMediaStore();
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();

  async function download(mediaId: string) {
    try {
      if (fileUrl.value) {
        URL.revokeObjectURL(fileUrl.value);
      }
      const { blob, mediaInfo: fetchedMediaInfo } = await mediaStore.fetchMedia(
        mediaId,
      );

      if (blob) {
        fileUrl.value = URL.createObjectURL(blob);
      }
      mediaInfo.value = fetchedMediaInfo;
    }
    catch (error) {
      errorHandlingStore.logErrorWithNotification(t("file.downloadError"), error);
      fileUrl.value = null;
      mediaInfo.value = null;
    }
  }

  onUnmounted(() => {
    if (fileUrl.value) {
      URL.revokeObjectURL(fileUrl.value);
    }
  });
  return { download, mediaInfo, fileUrl };
}

export interface MediaFileCollectionItem {
  blob: Blob | null;
  mediaInfo: MediaInfo;
  url: string;
}

export interface MediaFileCollectionProps {
  errorHandlingStore: IErrorHandlingStore;
  translate: (label: string, ...args: unknown[]) => string;
}

export function useMediaFileCollection({ errorHandlingStore, translate }: MediaFileCollectionProps) {
  const files = ref<
    MediaFileCollectionItem[]
  >([]);
  const mediaStore = useMediaStore();

  async function download(mediaIds: string[]) {
    try {
      removeAll();
      for (const mediaId of mediaIds) {
        await add(mediaId);
      }
    }
    catch (error) {
      errorHandlingStore.logErrorWithNotification(
        translate("file.downloadError"),
        error,
      );
    }
  }

  async function add(mediaId: string, position?: number) {
    const errorMsg = translate("file.couldNotBeLoaded");
    if (files.value.some(file => file.mediaInfo.id === mediaId)) {
      return false;
    }
    try {
      const { blob, mediaInfo: fetchedMediaInfo } = await mediaStore.fetchMedia(
        mediaId,
      );
      if (blob) {
        const newMedia = {
          blob,
          mediaInfo: fetchedMediaInfo,
          url: URL.createObjectURL(blob),
        };

        if (position !== undefined && position >= 0 && position < files.value.length) {
          if (files.value[position]) {
            URL.revokeObjectURL(files.value[position].url);
          }
          files.value[position] = newMedia;
        }
        else {
          files.value.push(newMedia);
        }
        return true;
      }
      else {
        errorHandlingStore.logErrorWithNotification(errorMsg);
      }
    }
    catch (error) {
      errorHandlingStore.logErrorWithNotification(errorMsg, error);
    }
    return false;
  }

  function remove(mediaId: string) {
    const foundIndex = files.value.findIndex(
      file => file.mediaInfo.id === mediaId,
    );
    if (foundIndex !== -1) {
      if (files.value[foundIndex]) {
        URL.revokeObjectURL(files.value[foundIndex].url);
      }
      files.value.splice(foundIndex, 1);
    }
  }

  function move(mediaId: string, newIndex: number) {
    const foundIndex = files.value.findIndex(
      file => file.mediaInfo.id === mediaId,
    );
    if (foundIndex !== -1) {
      const media = files.value.splice(foundIndex, 1)[0];
      if (media) {
        files.value.splice(newIndex, 0, media);
      }
    }
  }

  async function modify(oldMediaId: string, newMediaId: string) {
    const foundIndex = files.value.findIndex(
      file => file.mediaInfo.id === oldMediaId,
    );
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
