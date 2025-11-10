<script lang="ts" setup>
import { Disclosure } from "@headlessui/vue";
import { Button } from "primevue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const permalink = computed(() => String(route.params.permalink ?? ""));
const isChatRoute = computed(() => route.path.endsWith("/chat"));

function navigateToPassportView() {
  router.push(`/presentation/${permalink.value}`);
}

function navigateToAiChat() {
  router.push(`/presentation/${permalink.value}/chat`);
}

function backToApp() {
  router.push("/");
}
</script>

<template>
  <Disclosure as="header" class="bg-white shadow-sm">
    <div
      class="mx-auto max-w-7xl px-2 sm:px-4 lg:divide-y lg:divide-gray-200 lg:px-8"
    >
      <div class="relative flex h-32 justify-between items-center">
        <div class="flex px-2 lg:px-0">
          <div class="flex shrink-0 items-center">
            <img
              class="h-12 w-auto"
              src="../../assets/logo-with-text.svg"
              alt="open-dpp GmbH"
            >
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="!isChatRoute"
            icon="pi pi-android"
            :label="t('presentation.chatWithAI')"
            @click="navigateToAiChat"
          />
          <Button
            v-else
            icon="pi pi-home"
            :label="t('presentation.toPass')"
            @click="navigateToPassportView"
          />
          <Button class="p-button-secondary hidden md:flex" :label="t('presentation.backToApp')" @click="backToApp" />
        </div>
      </div>
    </div>
  </Disclosure>
</template>
