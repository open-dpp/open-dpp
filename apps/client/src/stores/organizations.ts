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
    const { data } = await apiClient.dpp.organizations.getMemberOrganizations();
    organizations.value = data || [];
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
    // getFullOrganization likely fetched by ID or current active one.
    // If better-auth had a context, we need to know WHICH org.
    // Assuming this function used fetching by ID from session or something?
    // authClient.organization.getFullOrganization() gets the organization in the active session.
    // We can't easily replace this unless we know the active org ID.
    // If the session has activeOrganizationId, we use getById.
    const { data: session } = await authClient.getSession();
    if (session?.session.activeOrganizationId) {
      const { data } = await apiClient.dpp.organizations.getById(session.session.activeOrganizationId);
      return data;
    }
    return null;
  }

  return { organizations, fetchOrganizations, createOrganization, fetchCurrentOrganization };
});
