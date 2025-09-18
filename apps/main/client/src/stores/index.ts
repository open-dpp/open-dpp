import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { LAST_SELECTED_ORGANIZATION_ID_KEY } from '../const';
import apiClient from '../lib/api-client';

export const useIndexStore = defineStore('index', () => {
  const selectedOrganization = ref<string | null>(
    localStorage.getItem(LAST_SELECTED_ORGANIZATION_ID_KEY)
      ? localStorage.getItem(LAST_SELECTED_ORGANIZATION_ID_KEY)
      : null,
  );

  const selectOrganization = (organizationId: string | null) => {
    if (!organizationId) {
      localStorage.removeItem(LAST_SELECTED_ORGANIZATION_ID_KEY);
      selectedOrganization.value = null;
      return;
    }
    localStorage.setItem(LAST_SELECTED_ORGANIZATION_ID_KEY, organizationId);
    selectedOrganization.value = organizationId;
    apiClient.setActiveOrganizationId(organizationId);
  };

  watch(
    () => selectedOrganization.value,
    (newVal) => {
      if (newVal) {
        apiClient.setActiveOrganizationId(newVal);
      }
    },
    {
      immediate: true,
    },
  );

  return { selectedOrganization, selectOrganization };
});
