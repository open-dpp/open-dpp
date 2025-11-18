<script setup lang="ts">
import {
  ChatBubbleOvalLeftEllipsisIcon,
  UserCircleIcon,
} from "@heroicons/vue/16/solid";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { Button } from "primevue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { MsgStatus, Sender, useAiAgentStore } from "../../stores/ai-agent";

const { t } = useI18n();
const aiAgentStore = useAiAgentStore();
const input = ref("");

onMounted(() => {
  aiAgentStore.connect();
});

function getMessageColor(msgStatus: MsgStatus) {
  if (msgStatus === MsgStatus.Success) {
    return "ring-gray-200";
  }
  if (msgStatus === MsgStatus.Error) {
    return "ring-red-200";
  }
  return "ring-blue-200";
}

function sendMessage() {
  aiAgentStore.sendMessage(input.value);
  input.value = "";
}

function sanitizeMarkdown(text: string): string {
  const parsed = marked.parse(text, { breaks: true, gfm: true });
  return DOMPurify.sanitize(parsed as string);
}
</script>

<template>
  <div class="flex flex-col gap-6 w-full my-10">
    <ul role="list" class="space-y-6">
      <li
        v-for="(message, messageIndex) in aiAgentStore.messages"
        :key="messageIndex"
      >
        <div class="flex gap-2">
          <UserCircleIcon
            v-if="message.sender === Sender.User"
            class="size-8 text-[#6EAED7] "
            aria-hidden="true"
          />
          <ChatBubbleOvalLeftEllipsisIcon
            v-else-if="message.sender === Sender.Bot"
            class="size-8 text-[#6BAD87] dark:text-gray-400"
            aria-hidden="true"
          />
          <div
            class="flex-1 rounded-md p-3 ring-1 ring-inset dark:ring-white/15"
            :class="[getMessageColor(message.status)]"
          >
            <p
              class="text-sm/6 text-gray-500 dark:text-gray-400"
              v-html="sanitizeMarkdown(message.text)"
            />
          </div>
        </div>
      </li>
    </ul>
    <div class="flex gap-2">
      <UserCircleIcon
        class="size-8 text-[#6EAED7]"
        aria-hidden="true"
      />
      <textarea
        id="question"
        v-model="input"
        rows="2"
        name="question"
        class="flex-1 overflow-hidden outline-gray-300 rounded-lg pb-12 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[#6EAED7] dark:bg-white/5 dark:outline-white/10"
        :placeholder="t('presentation.askQuestion')"
        :disabled="aiAgentStore.isLastMessagePendingFromBot"
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.shift.enter.exact.prevent="input += '\n'"
      />
      <Button
        :disabled="aiAgentStore.isLastMessagePendingFromBot"
        :label="t('common.send')"
        @click="sendMessage"
      />
    </div>
  </div>
</template>
