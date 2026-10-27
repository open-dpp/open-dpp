import apiClient from "../lib/api-client.ts";
import { computed, ref } from "vue";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useI18n } from "vue-i18n";
import { useUserStore } from "../stores/user.ts";
import { useIndexStore } from "../stores/index.ts";
import { UserRoleDto } from "@open-dpp/dto";

const ORGANIZATION_ID_PLACEHOLDER = "{organizationId}";

export function useInstanceSettings() {
  const { user } = useUserStore();
  const indexStore = useIndexStore();
  const organizationCreationEnabled = ref<boolean>(false);
  const usageManagementUrlTemplate = ref<string | undefined>(undefined);
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();

  async function fetchInstanceSettings() {
    try {
      const res = await apiClient.dpp.instanceSettings.getPublic();
      organizationCreationEnabled.value = res.data.organizationCreationEnabled ?? false;
      usageManagementUrlTemplate.value = res.data.usageManagementUrl;
    } catch {
      organizationCreationEnabled.value = false;
      usageManagementUrlTemplate.value = undefined;
      errorHandlingStore.logErrorWithNotification(
        t("organizations.admin.instanceSettings.errorLoading"),
      );
    }
  }

  const canCreateOrganization = computed(() => {
    return organizationCreationEnabled.value || user.role === UserRoleDto.ADMIN;
  });

  const usageManagementUrl = computed(() => {
    const url = usageManagementUrlTemplate.value;
    if (!url || !url.includes(ORGANIZATION_ID_PLACEHOLDER)) {
      return url;
    }
    if (!indexStore.selectedOrganization) {
      return undefined;
    }
    return url.replaceAll(
      ORGANIZATION_ID_PLACEHOLDER,
      encodeURIComponent(indexStore.selectedOrganization),
    );
  });

  return { canCreateOrganization, usageManagementUrl, fetchInstanceSettings };
}
