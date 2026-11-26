import { useI18n } from "vue-i18n";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useNotificationStore } from "../stores/notification.ts";

/** Copies text to the clipboard. Success and failure are reported as notifications. */
export function useCopyToClipboard() {
  const { t } = useI18n();
  const notificationStore = useNotificationStore();
  const { logErrorWithNotification } = useErrorHandlingStore();

  async function copyToClipboard(text: string) {
    try {
      // Not VueUse's useClipboard: it reports success even when its execCommand fallback fails.
      // This throws when the Clipboard API is missing and rejects when the write is denied.
      await navigator.clipboard.writeText(text);
      notificationStore.addSuccessNotification(t("common.clipboardSuccess"));
    } catch (error) {
      logErrorWithNotification(t("common.clipboardError"), error);
    }
  }

  return { copyToClipboard };
}
