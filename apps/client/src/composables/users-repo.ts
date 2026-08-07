import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useNotificationStore } from "../stores/notification.ts";

export function useUsersRepo() {
  const errorHandlingStore = useErrorHandlingStore();
  const notificationStore = useNotificationStore();
  const { t } = useI18n();

  async function resendPasswordReset(userId: string) {
    try {
      await apiClient.dpp.users.resendPasswordReset(userId);
      notificationStore.addSuccessNotification(
        t("organizations.admin.resendPasswordReset.success"),
      );
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("organizations.admin.resendPasswordReset.error"),
        error,
      );
    }
  }

  async function resendVerificationEmail(userId: string) {
    try {
      await apiClient.dpp.users.resendVerificationEmail(userId);
      notificationStore.addSuccessNotification(
        t("organizations.admin.resendVerificationEmail.success"),
      );
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("organizations.admin.resendVerificationEmail.error"),
        error,
      );
    }
  }

  async function resendMyVerificationEmail(): Promise<boolean> {
    try {
      await apiClient.dpp.users.resendMyVerificationEmail();
      notificationStore.addSuccessNotification(t("user.resendVerificationEmail.success"));
      return true;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("user.resendVerificationEmail.error"), error);
      return false;
    }
  }

  return { resendVerificationEmail, resendMyVerificationEmail, resendPasswordReset };
}
