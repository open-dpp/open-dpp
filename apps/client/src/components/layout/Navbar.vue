<script lang="ts" setup>
import { Button, Menubar } from "primevue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../../auth-client.ts";
import { VIEW_ROOT_URL } from "../../const.ts";
import { useAiAgentStore } from "../../stores/ai-agent.ts";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const session = authClient.useSession();
const permalink = computed(() => String(route.params.permalink ?? ""));
const aiAgentStore = useAiAgentStore();
const isSignedIn = computed<boolean>(() => {
  return session.value?.data != null;
});

function navigateToPassportView() {
  router.push(`/presentation/${permalink.value}`);
}

function navigateToAiChat() {
  router.push(`/presentation/${permalink.value}/chat`);
}

function backToApp() {
  router.push("/");
}

function sendEmail(service: string, intro: string) {
  const recipient = "info@open-dpp.de";
  const subject = `${service}, ID: ${permalink.value}`;
  const link = `${VIEW_ROOT_URL}/${permalink.value}`;
  const chatMessages = aiAgentStore.messages
    .map((message) => {
      const role
        = message.sender.charAt(0).toUpperCase() + message.sender.slice(1);
      return `${role}: ${message.text}`;
    })
    .join("\n\n");

  const body = `${intro}\n\n...\n\nLink: ${link}\n\nChat\n\n${chatMessages}\n\n${t("presentation.emailGreeting")}`;

  // Encode it properly
  const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Open email client
  window.location.href = mailtoLink;
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
      icon: "pi pi-android",
      command: () => {
        navigateToAiChat();
      },
    },
    {
      label: t("presentation.repairRequestSubject"),
      icon: "pi pi-wrench",
      command: () => {
        sendEmail(
          t("presentation.repairRequestSubject"),
          t("presentation.repairRequestIntro"),
        );
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
  <Menubar
    class="p-10!"
    :model="menuItems"
  >
    <template #start>
      <img
        class="h-12 w-auto"
        src="../../assets/logo-with-text.svg"
        alt="open-dpp GmbH logo"
      >
    </template>
    <template #end>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-android"
          size="large"
          rounded
          :aria-label="t('presentation.chatWithAI')"
          @click="navigateToAiChat"
        />
      </div>
    </template>
  </Menubar>
</template>
