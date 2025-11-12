<script lang="ts" setup>
import { Button, Menubar } from "primevue";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../../auth-client.ts";
import { VIEW_ROOT_URL } from "../../const.ts";
import { useAiAgentStore } from "../../stores/ai-agent.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const session = authClient.useSession();
const permalink = computed(() => String(route.params.permalink ?? ""));
const aiAgentStore = useAiAgentStore();
const isSignedIn = computed<boolean>(() => {
  return session.value?.data != null;
});
const errorHandlerStore = useErrorHandlingStore();

const confirm = useConfirm();

function navigateToPassportView() {
  router.push(`/presentation/${permalink.value}`);
}

function navigateToAiChat() {
  router.push(`/presentation/${permalink.value}/chat`);
}

function backToApp() {
  router.push("/");
}

function sendEmail(service: string, intro: string, addAIChat: boolean) {
  const recipient = "info@open-dpp.de";
  const subject = `${service}, ID: ${permalink.value}`;
  const link = `${VIEW_ROOT_URL}/${permalink.value}`;
  try {
    const chatMessages = addAIChat
      ? aiAgentStore.messages
          .map((message) => {
            const role
              = message.sender.charAt(0).toUpperCase() + message.sender.slice(1);
            return `${role}: ${message.text}`;
          })
          .join("\n\n")
      : "";

    const maxChatLength = 1000;
    const truncatedChat
      = chatMessages.length > maxChatLength
        ? `${chatMessages.substring(0, maxChatLength)}\n\n[... truncated]`
        : chatMessages;

    const body = `${intro}\n\n...\n\nLink: ${link}${addAIChat ? `\n\nChat:\n${truncatedChat}` : ""}\n\n${t("presentation.emailGreeting")}`;

    // Encode it properly
    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.location.href = mailtoLink;
  }
  catch (e) {
    errorHandlerStore.logErrorWithNotification(
      t("presentation.repairRequest.sendError"),
      e,
    );
  }
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
    {
      label: t("presentation.repairRequest.subject"),
      icon: "pi pi-wrench",
      command: () => {
        confirmToAddAIChatToEmail();
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

function confirmToAddAIChatToEmail() {
  confirm.require({
    message: t("presentation.repairRequest.addAiChatDialog.question"),
    header: t("presentation.repairRequest.addAiChatDialog.title"),
    icon: "pi pi-question-circle",
    rejectProps: {
      label: t("presentation.repairRequest.addAiChatDialog.doNotAdd"),
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: t("presentation.repairRequest.addAiChatDialog.add"),
    },
    accept: () => {
      sendEmail(
        t("presentation.repairRequest.subject"),
        t("presentation.repairRequest.intro"),
        true,
      );
    },
    reject: () => {
      sendEmail(
        t("presentation.repairRequest.subject"),
        t("presentation.repairRequest.intro"),
        false,
      );
    },
  });
}
</script>

<template>
  <Menubar class="p-10!" :model="menuItems">
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
