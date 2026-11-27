import type { FileUploadSelectEvent } from "primevue";
import { MEDIA_UPLOAD_MAX_SIZE_BYTES, MEDIA_UPLOAD_MIME_TYPES } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client";
import { handleApiError, isBadRequestError, LimitError } from "../lib/api-error-mapping";
import { useErrorHandlingStore } from "../stores/error.handling";
import { useMediaStore } from "../stores/media";
import { useNotificationStore } from "../stores/notification";

const BYTES_PER_MEGABYTE = 1024 * 1024;

/** The `accept` value of every media upload button: the shared allowlist, comma-separated. */
export const MEDIA_UPLOAD_ACCEPT = MEDIA_UPLOAD_MIME_TYPES.join(",");

/**
 * Uploads a file picked in the media library or the media picker to the organization's media,
 * and tells the user how it went.
 */
export function useMediaUpload() {
  const { t } = useI18n();
  const mediaStore = useMediaStore();
  const notificationStore = useNotificationStore();
  const errorHandlingStore = useErrorHandlingStore();

  function uploadErrorMessage(error: unknown): string {
    const apiError = handleApiError(error);
    if (apiError instanceof LimitError) {
      return t(`api.error.limit.${apiError.key}`, { limit: apiError.limit });
    }
    // The backend answers 400 for a type it does not accept, content it cannot read
    // and a file over the size limit
    if (isBadRequestError(error)) {
      return t("file.uploadInvalid", {
        maxSizeMb: MEDIA_UPLOAD_MAX_SIZE_BYTES / BYTES_PER_MEGABYTE,
      });
    }
    return t("file.uploadError");
  }

  async function onFileSelect(event: FileUploadSelectEvent) {
    const file = event.files?.[0] as File | undefined;
    if (!file) {
      return;
    }
    try {
      await apiClient.media.media.uploadGeneralMedia(file);
    } catch (error: unknown) {
      errorHandlingStore.logErrorWithNotification(uploadErrorMessage(error), error);
      return;
    }
    notificationStore.addSuccessNotification(t("file.uploadSuccess"));
    try {
      // The newest file comes first, so the first page is the one that shows the upload
      await mediaStore.showFirstOrganizationMediaPage();
    } catch (error: unknown) {
      // The file is saved by now: what failed is loading the list, not the upload
      errorHandlingStore.logErrorWithNotification(t("media.loadFailure"), error);
    }
  }

  return { accept: MEDIA_UPLOAD_ACCEPT, onFileSelect };
}
