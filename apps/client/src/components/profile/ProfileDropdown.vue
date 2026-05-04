<script lang="ts" setup>
import { computed, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { authClient } from "../../auth-client";
import type { MenuItem } from "primevue/menuitem";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();

const userNavigation = computed<MenuItem[]>(() => [
  {
    label: t("user.profile"),
    command: () => router.push("/profile"),
  },
  {
    label: t("user.logout"),
    command: () => router.push("/logout"),
  },
]);

const initials = computed(() => {
  const session = authClient.useSession();
  if (!session.value.data) return "AN";
  const userSession = session.value.data;
  const first = userSession.user.firstName?.substring(0, 1) || "A";
  const last = userSession.user.lastName?.substring(0, 1) || "N";
  return (first + last).toUpperCase();
});

const menu = useTemplateRef("menu");
</script>

<template>
  <Button aria-haspopup="true" aria-controls="profile_menu" v-slot="slotProps" asChild>
    <button
      @click="menu?.toggle($event)"
      v-bind="slotProps.a11yAttrs"
      class="hover:bg-primary-600 bg-primary-500 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-sm font-medium text-white"
    >
      {{ initials }}
    </button>
  </Button>
  <Menu ref="menu" id="profile_menu" :model="userNavigation" :popup="true"> </Menu>
</template>
