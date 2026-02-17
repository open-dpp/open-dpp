import type { OrganizationDto } from "@open-dpp/api-client";
import { defineStore } from "pinia";
import { ref } from "vue";
import { authClient } from "../auth-client.ts";
import apiClient from "../lib/api-client";
import { useNotificationStore } from "./notification.ts";

export const useOrganizationsStore = defineStore("organizations", () => {
  const organizations = ref<OrganizationDto[]>([]);

  const addOrganization = (org: OrganizationDto) => {
    organizations.value.push(org);
  };

  const fetchOrganizations = async () => {
    const notificationsStore = useNotificationStore();
    try {
      const { data } = await apiClient.dpp.organizations.getMemberOrganizations();
      organizations.value = data || [];
    }
    catch (error: any) {
      notificationsStore.addErrorNotification(error.message ?? "Error fetching organizations");
    }
  };

  const createOrganization = async (orgData: { name: string }) => {
    const notificationsStore = useNotificationStore();
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
    catch (error: any) {
      notificationsStore.addErrorNotification(error.message ?? "Error creating organization");
      return null;
    }
    return null;
  };

  async function fetchCurrentOrganization() {
    const notificationsStore = useNotificationStore();
    try {
      const { data: session } = await authClient.getSession();
      if (session?.session.activeOrganizationId) {
        const { data } = await apiClient.dpp.organizations.getById(session.session.activeOrganizationId);
        return data;
      }
      return null;
    }
    catch (error: any) {
      notificationsStore.addErrorNotification(error.message ?? "Error fetching current organization");
      return null;
    }
  }

  return { organizations, fetchOrganizations, createOrganization, fetchCurrentOrganization };
});
