<script lang="ts" setup>
import { onMounted } from "vue";
import { authClient } from "../auth-client.ts";
import { useIndexStore } from "../stores";

const indexStore = useIndexStore();

onMounted(async () => {
  await authClient.signOut();
  indexStore.selectOrganization(null);
});
</script>

<template>
  <section />
</template>
