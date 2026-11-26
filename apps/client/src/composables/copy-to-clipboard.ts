import { useClipboard } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useNotificationStore } from "../stores/notification.ts";

/**
 * Copies text to the clipboard. Success and failure are reported as notifications.
 *
 * Limitation: when the Clipboard API rejects a write or its permission is unknown, useClipboard
 * falls back to document.execCommand and ignores the result, so such a failure counts as success.
 */
export function useCopyToClipboard() {
  const { t } = useI18n();
  const notificationStore = useNotificationStore();
  const { logErrorWithNotification } = useErrorHandlingStore();
  const { copy, isSupported } = useClipboard();

  async function copyToClipboard(text: string) {
    try {
      // copy() resolves without doing anything when the clipboard is unsupported
      if (!isSupported.value) throw new Error("The Clipboard API is not available");
      await copy(text);
      notificationStore.addSuccessNotification(t("common.clipboardSuccess"));
    } catch (error) {
      logErrorWithNotification(t("common.clipboardError"), error);
    }
  }

  return { copyToClipboard };
}
