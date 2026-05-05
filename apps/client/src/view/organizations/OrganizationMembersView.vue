<script lang="ts" setup>
import type { MemberDto } from "@open-dpp/api-client";
import { ref, watch } from "vue";
import OrganizationMembersList from "../../components/organizations/OrganizationMembersList.vue";
import apiClient from "../../lib/api-client";
import { useIndexStore } from "../../stores/index";
import ContentViewWrapper from "../ContentViewWrapper.vue";

const members = ref<Array<MemberDto>>([]);
const indexStore = useIndexStore();

async function fetchMembers() {
  if (!indexStore.selectedOrganization) return;
  try {
    const { data } = await apiClient.dpp.organizations.getMembers(indexStore.selectedOrganization);
    members.value = data;
  } catch (error) {
    console.error("Failed to fetch members", error);
    members.value = [];
  }
}

watch(() => indexStore.selectedOrganization, fetchMembers, { immediate: true });
</script>

<template>
  <ContentViewWrapper>
    <OrganizationMembersList
      v-if="indexStore.selectedOrganization"
      :members="members"
      :organization-id="indexStore.selectedOrganization"
    />
  </ContentViewWrapper>
</template>
