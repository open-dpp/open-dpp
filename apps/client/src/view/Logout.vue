<script lang="ts" setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { sameOriginRedirectOf } from "../lib/login-utils.ts";
import { authClient } from "../auth-client.ts";
import { useIndexStore } from "../stores";
import { useOrganizationsStore } from "../stores/organizations.ts";
import { useUserStore } from "../stores/user.ts";

const router = useRouter();
const route = useRoute();
const indexStore = useIndexStore();
const userStore = useUserStore();
const organizationsStore = useOrganizationsStore();
onMounted(async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: async () => {
        indexStore.selectOrganization(null);
        userStore.reset();
        organizationsStore.reset();
        // e.g. back to the product page the user signed out from, never to another site
        await router.push(sameOriginRedirectOf(route.query, window.location.origin) ?? "/signin");
      },
    },
  });
});
</script>

<template>
  <section />
</template>
