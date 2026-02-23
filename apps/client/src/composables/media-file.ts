import type { MediaInfo } from "../components/media/MediaInfo.interface.ts";
import { onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useIndexStore } from "../stores";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useMediaStore } from "../stores/media.ts";
import { useNotificationStore } from "../stores/notification.ts";

export function useMediaFile() {
  const mediaInfo = ref<MediaInfo | null>(null);
  const fileUrl = ref<string | null>(null);
  const mediaStore = useMediaStore();
  const errorHandlingStore = useErrorHandlingStore();
  const indexStore = useIndexStore();
  const notificationStore = useNotificationStore();
  const progress = ref<number>(0);
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

  async function uploadFile(file: File): Promise<string | undefined> {
    let mediaInfoId: string | undefined;
    try {
      mediaInfoId = await mediaStore.uploadMedia(
        indexStore.selectedOrganization,
        file,
        (newProgress: number) => (progress.value = newProgress),
      );
      notificationStore.addSuccessNotification(t("file.uploadSuccess"));
    }
    catch (error: unknown) {
      errorHandlingStore.logErrorWithNotification(t("file.uploadError"), error);
      return undefined;
    }
    finally {
      progress.value = 0;
    }
    return mediaInfoId;
  }

  onUnmounted(() => {
    if (fileUrl.value) {
      URL.revokeObjectURL(fileUrl.value);
    }
  });
  return { download, mediaInfo, fileUrl, progress, uploadFile };
}
