<script lang="ts" setup>
import type { MemberDto, OrganizationDto } from "@open-dpp/api-client";
import { onMounted, ref } from "vue";
import { authClient } from "../../auth-client.ts";
import OrganizationInvitationsList from "../../components/organizations/OrganizationInvitationsList.vue";
import OrganizationMembersList from "../../components/organizations/OrganizationMembersList.vue";
import apiClient from "../../lib/api-client";

const members = ref<Array<MemberDto>>([]);
const organization = ref<OrganizationDto | null>(null);

async function fetchMembers() {
  if (!organization.value)
    return;
  const { data } = await apiClient.dpp.organizations.getMembers(organization.value.id);
  members.value = data;
}

onMounted(async () => {
  const { data } = await authClient.organization.getFullOrganization();
  if (data) {
    organization.value = {
      id: data.id,
      name: data.name,
      slug: data.slug || data.name, // Fallback if better-auth response differs
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date(),
    } as OrganizationDto;
    await fetchMembers();
  }
});
</script>

<template>
  <section class="pt-2 pb-10">
    <OrganizationInvitationsList />
  </section>
  <section>
    <OrganizationMembersList
      v-if="organization"
      :members="members"
      :organization="organization"
      @invited-user="fetchMembers"
    />
  </section>
</template>
