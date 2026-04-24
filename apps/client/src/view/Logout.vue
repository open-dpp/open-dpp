<script lang="ts" setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { authClient } from "../auth-client.ts";
import { useIndexStore } from "../stores";

const router = useRouter();
const indexStore = useIndexStore();
onMounted(async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: async () => {
        indexStore.selectOrganization(null);
        await router.push("/signin");
      },
    },
  });
});
</script>

<template>
  <section />
</template>
