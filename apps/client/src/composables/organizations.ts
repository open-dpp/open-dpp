import type { MemberDto } from "@open-dpp/api-client";
import type { MemberRoleDtoType } from "@open-dpp/dto";
import { useConfirm } from "primevue/useconfirm";
import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { HTTPCode } from "../stores/http-codes.ts";

export function useOrganizations() {
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();
  const confirm = useConfirm();

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

  function removeMember(member: MemberDto, onRemoved: () => Promise<void> | void) {
    confirm.require({
      header: t("organizations.removeMemberDialog.header"),
      message: t("organizations.removeMemberDialog.message", {
        email: member.user?.email ?? "",
      }),
      acceptLabel: t("common.remove"),
      rejectLabel: t("common.cancel"),
      acceptProps: { severity: "danger" },
      accept: async () => {
        const errorMsg = t("organizations.removeMemberError");
        try {
          // axios rejects on non-2xx, so reaching this line means success
          // (the endpoint responds 204 No Content).
          await apiClient.dpp.organizations.removeMember(member.id);
          await onRemoved();
        } catch (error) {
          errorHandlingStore.logErrorWithNotification(errorMsg, error);
        }
      },
    });
  }

  return { changeMemberRole, removeMember };
}
