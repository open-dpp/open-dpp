import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useNotificationStore } from "../stores/notification.ts";

export function useUsersRepo() {
  const errorHandlingStore = useErrorHandlingStore();
  const notificationStore = useNotificationStore();
  const { t } = useI18n();

  async function resendVerificationEmail(): Promise<boolean> {
    try {
      await apiClient.dpp.users.resendMyVerificationEmail();
      notificationStore.addSuccessNotification(t("user.resendVerificationEmail.success"));
      return true;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("user.resendVerificationEmail.error"), error);
      return false;
    }
  }

  return { resendVerificationEmail };
}
