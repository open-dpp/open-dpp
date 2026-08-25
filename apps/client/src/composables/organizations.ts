import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useI18n } from "vue-i18n";
import { HTTPCode } from "../stores/http-codes.ts";
import type { MemberRoleDtoType } from "@open-dpp/dto";

export function useOrganizations() {
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();

  async function changeMemberRole(memberId: string, role: MemberRoleDtoType) {
    const errorMsg = t("organizations.changeRoleError");
    try {
      const response = await apiClient.dpp.organizations.changeMemberRole(memberId, role);
      if (response.status !== HTTPCode.OK) {
        errorHandlingStore.logErrorWithNotification(errorMsg);
        return false;
      }
      return true;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(errorMsg, error);
      return false;
    }
  }

  return { changeMemberRole };
}
