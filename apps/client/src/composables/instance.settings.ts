import apiClient from "../lib/api-client.ts";
import { computed, ref } from "vue";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useI18n } from "vue-i18n";
import { useUserStore } from "../stores/user.ts";
import { UserRoleDto } from "@open-dpp/dto";

export function useInstanceSettings() {
  const { user } = useUserStore();
  const organizationCreationEnabled = ref<boolean>(false);
  // off = no SMTP on this instance; self-service mail actions are hidden
  const mailEnabled = ref<boolean>(true);
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();

  async function fetchInstanceSettings() {
    try {
      const res = await apiClient.dpp.instanceSettings.getPublic();
      organizationCreationEnabled.value = res.data.organizationCreationEnabled ?? false;
      mailEnabled.value = res.data.mailEnabled;
    } catch {
      organizationCreationEnabled.value = false;
      errorHandlingStore.logErrorWithNotification(
        t("organizations.admin.instanceSettings.errorLoading"),
      );
    }
  }

  const canCreateOrganization = computed(() => {
    return organizationCreationEnabled.value || user.role === UserRoleDto.ADMIN;
  });

  return { canCreateOrganization, mailEnabled, fetchInstanceSettings };
}
