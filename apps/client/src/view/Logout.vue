<script lang="ts" setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { authClient } from "../auth-client.ts";
import { useIndexStore } from "../stores";

const indexStore = useIndexStore();
const router = useRouter();

onMounted(async () => {
  await authClient.signOut();
  indexStore.selectOrganization(null);
  await router.push("/signin");
});
</script>

<template>
  <section />
</template>
