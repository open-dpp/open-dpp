import { defineStore } from "pinia";
import { ref } from "vue";
import { OrganizationDto } from "@open-dpp/api-client";
import apiClient from "../lib/api-client";

export const useOrganizationsStore = defineStore("organizations", () => {
  const organizations = ref<OrganizationDto[]>([]);

  const fetchOrganizations = async () => {
    const response = await apiClient.dpp.organizations.getAll();
    organizations.value = response.data;
  };

  const createOrganization = async (data: { name: string }) => {
    const response = await apiClient.dpp.organizations.post({
      name: data.name,
    });
    organizations.value.push(response.data);
    return response.data;
  };

  return { organizations, fetchOrganizations, createOrganization };
});
