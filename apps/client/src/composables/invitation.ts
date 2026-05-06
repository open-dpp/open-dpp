import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import type { InvitationResponseDto, InvitationStatusDtoType } from "@open-dpp/dto";
import { HTTPCode } from "../stores/http-codes.ts";

export function useInvitations() {
  const errorHandlingStore = useErrorHandlingStore();
  const invitations = ref<InvitationResponseDto[]>([]);
  const { t } = useI18n();
  async function fetchInvitations(params?: { status: InvitationStatusDtoType }) {
    const errorMsg = t("organizations.invitation.errorLoading", 2);
    try {
      const response = await apiClient.dpp.users.getInvitations(params);
      if (response.status !== HTTPCode.OK) {
        errorHandlingStore.logErrorWithNotification(errorMsg);
      }
      invitations.value = response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(errorMsg, error);
    }
  }

  async function fetchInvitation(id: string): Promise<InvitationResponseDto | undefined> {
    const errorMsg = t("organizations.invitation.errorLoading");
    try {
      const response = await apiClient.dpp.organizations.getInvitation(id);
      if (response.status !== HTTPCode.OK) {
        errorHandlingStore.logErrorWithNotification(errorMsg);
      } else {
        return response.data;
      }
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(errorMsg, error);
    }
  }

  return { fetchInvitations, invitations, fetchInvitation };
}
