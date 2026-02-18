<script lang="ts" setup>
import type { MemberDto } from "@open-dpp/api-client";
import { onMounted, ref } from "vue";
import OrganizationInvitationsList from "../../components/organizations/OrganizationInvitationsList.vue";
import OrganizationMembersList from "../../components/organizations/OrganizationMembersList.vue";
import apiClient from "../../lib/api-client";
import { useIndexStore } from "../../stores/index";

const members = ref<Array<MemberDto>>([]);
const indexStore = useIndexStore();

async function fetchMembers() {
  if (!indexStore.selectedOrganization)
    return;
  try {
    const { data } = await apiClient.dpp.organizations.getMembers(indexStore.selectedOrganization);
    members.value = data;
  }
  catch (error) {
    console.error("Failed to fetch members", error);
    members.value = [];
  }
}

onMounted(async () => {
  await fetchMembers();
});
</script>

<template>
  <section class="pt-2 pb-10">
    <OrganizationInvitationsList />
  </section>
  <section>
    <OrganizationMembersList
      v-if="indexStore.selectedOrganization"
      :members="members"
      :organization-id="indexStore.selectedOrganization"
      @invited-user="fetchMembers"
    />
  </section>
</template>
