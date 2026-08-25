<script lang="ts" setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { authClient } from "../auth-client.ts";
import { useIndexStore } from "../stores";
import { useUserStore } from "../stores/user.ts";

const router = useRouter();
const indexStore = useIndexStore();
const userStore = useUserStore();
onMounted(async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: async () => {
        indexStore.selectOrganization(null);
        userStore.reset();
        await router.push("/signin");
      },
    },
  });
});
</script>

<template>
  <section />
</template>
