<script lang="ts" setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { authClient } from "../auth-client.ts";

const router = useRouter();

onMounted(async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: async () => {
        await router.push("/signin");
      },
    },
  });
});
</script>

<template>
  <section />
</template>
