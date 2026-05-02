<script lang="ts" setup>
import { computed } from "vue";
import { authClient } from "../../auth-client";

const fullName = computed(() => {
  const session = authClient.useSession();
  if (!session.value.data) return "AN";
  const userSession = session.value.data;
  const first = userSession.user.firstName;
  const last = userSession.user.lastName;
  return `${first} ${last}`;
});
</script>

<template>
  <span
    aria-hidden="true"
    class="ml-4 hidden text-sm leading-6 font-semibold text-gray-900 xl:inline-block"
    >{{ fullName ?? "AN" }}</span
  >
</template>
