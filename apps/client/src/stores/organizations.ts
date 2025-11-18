import type { OrganizationDto } from "@open-dpp/api-client";
import { defineStore } from "pinia";
import { ref } from "vue";
import { authClient } from "../auth-client.ts";
import { useNotificationStore } from "./notification.ts";

export const useOrganizationsStore = defineStore("organizations", () => {
  const organizations = ref<OrganizationDto[]>([]);

  const addOrganization = (org: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    logo?: string | null | undefined;
    metadata?: any;
  }) => {
    organizations.value.push({
      id: org.id,
      name: org.name,
      members: [],
      createdByUserId: "",
      ownedByUserId: "",
    });
  };

  const fetchOrganizations = async () => {
    const { data } = await authClient.organization.list();
    organizations.value = data
      ? data.map((org) => {
          return {
            id: org.id,
            name: org.name,
            members: [],
            createdByUserId: "",
            ownedByUserId: "",
          };
        })
      : [];
  };

  const createOrganization = async (orgData: { name: string }) => {
    const notificationsStore = useNotificationStore();
    const { data, error } = await authClient.organization.create({
      name: orgData.name,
      slug: orgData.name,
    });
    if (error) {
      notificationsStore.addErrorNotification(error.message ?? "Error creating organization");
      return null;
    }
    if (data) {
      addOrganization(data);
    }
    return data;
  };

  return { organizations, fetchOrganizations, createOrganization };
});
