<script lang="ts" setup>
import type { OrganizationDto, UserDto } from "@open-dpp/api-client";
import { onMounted, ref } from "vue";
import OrganizationMembersList from "../../components/organizations/OrganizationMembersList.vue";
import apiClient from "../../lib/api-client";
import { useIndexStore } from "../../stores";

const indexStore = useIndexStore();

const members = ref<Array<UserDto>>([]);
const organization = ref<OrganizationDto | null>(null);

async function fetchMembers() {
  if (indexStore.selectedOrganization) {
    const res = await apiClient.dpp.organizations.getMembers(
      indexStore.selectedOrganization,
    );
    members.value = res.data;
  }
}

onMounted(async () => {
  if (indexStore.selectedOrganization) {
    const resOrg = await apiClient.dpp.organizations.getById(
      indexStore.selectedOrganization,
    );
    organization.value = resOrg.data;
    await fetchMembers();
  }
});
</script>

<template>
  <section>
    <OrganizationMembersList
      v-if="organization"
      :members="members"
      :organization="organization"
      @invited-user="fetchMembers"
    />
  </section>
</template>
