<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import type { MenuItem } from "primevue/menuitem";
import { useRouter } from "vue-router";
import { useUserStore } from "../../stores/user";

const { t } = useI18n();
const router = useRouter();
const { me } = storeToRefs(useUserStore());

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
  if (!me.value) return "AN";
  const first = me.value.firstName?.substring(0, 1) || "A";
  const last = me.value.lastName?.substring(0, 1) || "N";
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
