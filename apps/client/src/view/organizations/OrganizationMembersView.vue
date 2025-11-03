<script lang="ts" setup>
import type { OrganizationDto, UserDto } from "@open-dpp/api-client";
import { onMounted, ref } from "vue";
import { authClient } from "../../auth-client.ts";
import OrganizationInvitationsList from "../../components/organizations/OrganizationInvitationsList.vue";
import OrganizationMembersList from "../../components/organizations/OrganizationMembersList.vue";
import { useIndexStore } from "../../stores";

const indexStore = useIndexStore();

const members = ref<Array<UserDto>>([]);
const organization = ref<OrganizationDto | null>(null);

async function fetchMembers() {
  const { data } = await authClient.organization.listMembers();
  members.value = data
    ? data.members.map((member) => {
        return {
          id: member.user.id,
          email: member.user.email,
        };
      })
    : [];
}

onMounted(async () => {
  const { data } = await authClient.organization.getFullOrganization();
  if (data) {
    organization.value = {
      id: data.id,
      name: data.name,
      members: [],
      createdByUserId: "",
      ownedByUserId: "",
    };
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
