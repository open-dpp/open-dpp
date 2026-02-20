import type { OrganizationDto } from "@open-dpp/api-client";
import { defineStore } from "pinia";
import { ref } from "vue";
import { authClient } from "../auth-client.ts";
import apiClient from "../lib/api-client";
import { i18n } from "../translations/i18n.ts";
import { useErrorHandlingStore } from "./error.handling.ts";

export const useOrganizationsStore = defineStore("organizations", () => {
  const organizations = ref<OrganizationDto[]>([]);
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = i18n.global;

  const addOrganization = (org: OrganizationDto) => {
    organizations.value.push(org);
  };

  const fetchOrganizations = async () => {
    try {
      const { data } = await apiClient.dpp.organizations.getMemberOrganizations();
      organizations.value = data || [];
    }
    catch (error: unknown) {
      errorHandlingStore.logErrorWithNotification(t("organizations.fetchError"), error);
    }
  };

  const createOrganization = async (orgData: { name: string }) => {
    try {
      const { data } = await apiClient.dpp.organizations.post({
        name: orgData.name,
        slug: orgData.name, // Slug generation logic might be needed
      });
      if (data) {
        addOrganization(data);
        return data;
      }
    }
    catch (error: unknown) {
      errorHandlingStore.logErrorWithNotification(t("organizations.createError"), error);
      return null;
    }
    return null;
  };

  async function fetchCurrentOrganization() {
    try {
      const { data: session } = await authClient.getSession();
      if (session?.session.activeOrganizationId) {
        const { data } = await apiClient.dpp.organizations.getById(session.session.activeOrganizationId);
        return data;
      }
      return null;
    }
    catch (error: unknown) {
      errorHandlingStore.logErrorWithNotification(t("organizations.fetchCurrentError"), error);
      return null;
    }
  }

  return { organizations, fetchOrganizations, createOrganization, fetchCurrentOrganization };
});
