<script lang="ts" setup>
import { Button, SpeedDial } from "primevue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import logo from "../../assets/logo.svg";
import { VIEW_ROOT_URL } from "../../const.ts";
import { useAiAgentStore } from "../../stores/ai-agent.ts";
import Footer from "./Footer.vue";
import Navbar from "./Navbar.vue";

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const permalink = computed(() => String(route.params.permalink ?? ""));
const aiAgentStore = useAiAgentStore();

function sendEmail(service: string, intro: string) {
  const recipient = "info@open-dpp.de";
  const subject = `${service}, ID: ${permalink.value}`;
  const link = `${VIEW_ROOT_URL}/${permalink.value}`;
  const chatMessages = aiAgentStore.messages
    .map((message) => {
      const role = message.sender.charAt(0).toUpperCase() + message.sender.slice(1);
      return `${role}: ${message.text}`;
    })
    .join("\n\n");

  const body = `${intro}\n\n...\n\nLink: ${link}\n\nChat\n\n${chatMessages}\n\n${t("presentation.emailGreeting")}`;

  // Encode it properly
  const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Open email client
  window.location.href = mailtoLink;
}

const repairAction = {
  label: "Repair",
  icon: "pi pi-wrench",
  command: () => {
    sendEmail(t("presentation.repairRequestSubject"), t("presentation.repairRequestIntro"));
  },
};

const items = computed(() => route.path.endsWith("/chat")
  ? [{
      label: t("presentation.toPass"),
      icon: "pi pi-home",
      command: () => {
        router.push(`/presentation/${permalink.value}`);
      },
    }, repairAction]
  : [
      {
        label: t("presentation.chatWithAI"),
        icon: "pi pi-android",
        command: () => {
          router.push(`/presentation/${permalink.value}/chat`);
        },
      },
      repairAction,
    ]);
</script>

<template>
  <div>
    <div class="xl:max-w-7xl pt-10 mx-auto">
      <div class="flex flex-col gap-5">
        <div class="bg-white shadow-sm">
          <Navbar />
        </div>
        <div class="bg-white shadow-sm">
          <main>
            <div class="px-4 sm:px-6 lg:px-8">
              <router-view />
            </div>
          </main>
        </div>
        <div>
          <Footer />
        </div>
      </div>
      <div class="sticky bottom-0 right-0 p-16">
        <SpeedDial
          :model="items"
          direction="up"
          style="position: absolute; bottom: 24px; right: 0"
        >
          <template #button="{ toggleCallback }">
            <Button
              variant="outlined"
              class="border-none!"
              @click="toggleCallback"
            >
              <img :src="logo" alt="Action menu" class="cursor-pointer h-16 w-auto">
            </Button>
          </template>
          <template #item="{ item, toggleCallback }">
            <Button
              size="large"
              :icon="item.icon"
              rounded
              @click="toggleCallback"
            />
          </template>
        </SpeedDial>
      </div>
    </div>
  </div>
</template>
