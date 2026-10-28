<script lang="ts" setup>
import GuestAccessList from "../../components/organizations/GuestAccessList.vue";
import { useIndexStore } from "../../stores/index";
import ContentViewWrapper from "../ContentViewWrapper.vue";

const indexStore = useIndexStore();
</script>

<template>
  <ContentViewWrapper>
    <GuestAccessList
      v-if="indexStore.selectedOrganization"
      :key="indexStore.selectedOrganization"
    />
  </ContentViewWrapper>
</template>
