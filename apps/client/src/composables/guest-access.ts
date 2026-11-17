import type { CreateGuestAccessDto, GuestAccessResponseDto, GuestRoleDtoType } from "@open-dpp/dto";
import { GuestAccessKindDto, GuestAccessStatusDto } from "@open-dpp/dto";
import { useConfirm } from "primevue/useconfirm";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";

export function useGuestAccess() {
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();
  const confirm = useConfirm();

  const guestAccesses = ref<GuestAccessResponseDto[]>([]);

  async function fetchGuestAccesses() {
    try {
      const response = await apiClient.dpp.guestAccess.getAll();
      guestAccesses.value = response.data;
    } catch (error) {
      guestAccesses.value = [];
      errorHandlingStore.logErrorWithNotification(t("guestAccess.errorLoading"), error);
    }
  }

  // Resolves to true if the invitation was created. The owner learns nothing about accounts.
  async function inviteGuest(email: string, guestRole: GuestRoleDtoType): Promise<boolean> {
    const data: CreateGuestAccessDto = {
      kind: GuestAccessKindDto.DIRECT,
      email: email.trim(),
      guestRole,
    };
    try {
      await apiClient.dpp.guestAccess.invite(data);
      return true;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("guestAccess.inviteError"), error);
      return false;
    }
  }

  async function changeGuestRole(id: string, guestRole: GuestRoleDtoType): Promise<boolean> {
    try {
      await apiClient.dpp.guestAccess.changeRole(id, { guestRole });
      return true;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("guestAccess.changeRoleError"), error);
      return false;
    }
  }

  function revokeGuestAccess(
    guestAccess: GuestAccessResponseDto,
    onRevoked: () => Promise<void> | void,
  ) {
    confirm.require({
      header: t("guestAccess.revokeDialog.header"),
      message: t("guestAccess.revokeDialog.message", { email: guestAccess.email }),
      acceptLabel: t("guestAccess.revoke"),
      rejectLabel: t("common.cancel"),
      acceptProps: { severity: "danger" },
      accept: async () => {
        try {
          await apiClient.dpp.guestAccess.revoke(guestAccess.id);
          await onRevoked();
        } catch (error) {
          errorHandlingStore.logErrorWithNotification(t("guestAccess.revokeError"), error);
        }
      },
    });
  }

  // A revoked access cannot be changed anymore
  function isEditable(guestAccess: GuestAccessResponseDto) {
    return guestAccess.status !== GuestAccessStatusDto.REVOKED;
  }

  function statusLabel(guestAccess: GuestAccessResponseDto) {
    return t(`guestAccess.status.${guestAccess.status}`);
  }

  return {
    guestAccesses,
    fetchGuestAccesses,
    inviteGuest,
    changeGuestRole,
    revokeGuestAccess,
    isEditable,
    statusLabel,
  };
}
