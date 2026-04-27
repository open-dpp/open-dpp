import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import type { InvitationResponseDto } from "@open-dpp/dto";
import { HTTPCode } from "../stores/http-codes.ts";

export function useInvitations() {
  const errorHandlingStore = useErrorHandlingStore();
  const invitations = ref<InvitationResponseDto[]>([]);
  const { t } = useI18n();
  async function fetchInvitations() {
    const errorMsg = t("organizations.invitation.errorLoading");
    try {
      const response = await apiClient.dpp.users.getInvitations();
      if (response.status !== HTTPCode.OK) {
        errorHandlingStore.logErrorWithNotification(errorMsg);
      }
      invitations.value = response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(errorMsg, error);
    }
  }
  return { fetchInvitations, invitations };
}
