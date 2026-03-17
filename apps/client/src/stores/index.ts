import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { authClient } from "../auth-client.ts";
import { LAST_SELECTED_ORGANIZATION_ID_KEY } from "../const";
import apiClient from "../lib/api-client";
import { setAxiosOrganizationId } from "../lib/axios";

export const useIndexStore = defineStore("index", () => {
  const selectedOrganization = ref<string | null>(
    localStorage.getItem(LAST_SELECTED_ORGANIZATION_ID_KEY)
      ? localStorage.getItem(LAST_SELECTED_ORGANIZATION_ID_KEY)
      : null,
  );

  const selectOrganization = (organizationId: string | null) => {
    if (!organizationId) {
      localStorage.removeItem(LAST_SELECTED_ORGANIZATION_ID_KEY);
      selectedOrganization.value = null;
      setAxiosOrganizationId(null);
      return;
    }
    localStorage.setItem(LAST_SELECTED_ORGANIZATION_ID_KEY, organizationId);
    selectedOrganization.value = organizationId;
    apiClient.setActiveOrganizationId(organizationId);
    setAxiosOrganizationId(organizationId);
  };

  watch(
    () => selectedOrganization.value,
    async (newVal) => {
      if (newVal) {
        apiClient.setActiveOrganizationId(newVal);
        setAxiosOrganizationId(newVal);
        await authClient.organization.setActive({
          organizationId: newVal,
        });
      }
    },
    {
      immediate: true,
    },
  );

  return { selectedOrganization, selectOrganization };
});
