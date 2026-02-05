<script lang="ts" setup>
import { Button, Menubar } from "primevue";
import ConfirmDialog from "primevue/confirmdialog";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../../auth-client.ts";
import { useBrandingStore } from "../../stores/branding.ts";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const session = authClient.useSession();
const permalink = computed(() => String(route.params.permalink ?? ""));
const isSignedIn = computed<boolean>(() => {
  return session.value?.data != null;
});
const brandingStore = useBrandingStore();

function navigateToPassportView() {
  router.push(`/presentation/${permalink.value}`);
}

function navigateToAiChat() {
  router.push(`/presentation/${permalink.value}/chat`);
}

function backToApp() {
  router.push("/");
}

const menuItems = computed(() => {
  const items = [
    {
      label: t("presentation.toPass"),
      icon: "pi pi-home",
      command: () => {
        navigateToPassportView();
      },
    },
    {
      label: t("presentation.chatWithAI"),
      icon: "pi pi-comments",
      command: () => {
        navigateToAiChat();
      },
    },
  ];

  if (isSignedIn.value) {
    items.push({
      label: t("presentation.backToApp"),
      icon: "pi pi-arrow-left",
      command: () => {
        backToApp();
      },
    });
  }

  return items;
});
</script>

<template>
  <Menubar class="p-10!" :model="menuItems">
    <template #start>
      <img
        class="h-16 p-2 w-auto"
        :src="brandingStore.logo ? brandingStore.logo.url : '../../assets/logo-with-text.svg'"
        alt="open-dpp GmbH logo"
      >
    </template>
    <template #end>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-comments"
          size="large"
          rounded
          :aria-label="t('presentation.chatWithAI')"
          @click="navigateToAiChat"
        />
      </div>
    </template>
  </Menubar>
  <ConfirmDialog />
</template>
