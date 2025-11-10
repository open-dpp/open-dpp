<script lang="ts" setup>
import { Disclosure } from "@headlessui/vue";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/vue/16/solid";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../../auth-client.ts";
import BaseButton from "../presentation-components/BaseButton.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const permalink = computed(() => String(route.params.permalink ?? ""));
const isChatRoute = computed(() => route.path.endsWith("/chat"));
const isSignedIn = ref<boolean>(false);

onMounted(async () => {
  const { data: session } = await authClient.getSession();
  isSignedIn.value = session !== null;
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
          <BaseButton
            v-if="!isChatRoute"
            variant="primary"
            @click="navigateToAiChat"
          >
            <ChatBubbleOvalLeftEllipsisIcon class="size-5 mr-2 inline-block" />
            {{ t('presentation.chatWithAI') }}
          </BaseButton>
          <BaseButton
            v-else
            variant="primary"
            @click="navigateToPassportView"
          >
            {{ t('presentation.toPass') }}
          </BaseButton>
          <BaseButton v-if="isSignedIn" class="hidden md:flex" @click="backToApp">
            <span>{{ t('presentation.backToApp') }}</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </Disclosure>
</template>
