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
            class="size-8 text-indigo-500 dark:text-indigo-400"
            aria-hidden="true"
          />
          <ChatBubbleOvalLeftEllipsisIcon
            v-else-if="message.sender === Sender.Bot"
            class="size-8 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
          />
          <div
            :class="[
              getMessageColor(message.status),
              'flex-1 rounded-md p-3 ring-1 ring-inset dark:ring-white/15',
            ]"
          >
            <p class="text-sm/6 text-gray-500 dark:text-gray-400">
              {{ message.text }}
            </p>
          </div>
        </div>
      </li>
    </ul>
    <div class="flex gap-2">
      <UserCircleIcon
        class="size-8 text-indigo-500 dark:text-indigo-400"
        aria-hidden="true"
      />
      <textarea
        v-model="input"
        rows="2"
        name="question"
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.shift.enter.exact.prevent="input += '\n'"
        id="question"
        class="flex-1 overflow-hidden outline-gray-300 rounded-lg pb-12 outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:focus-within:outline-indigo-500"
        placeholder="Stellen Sie Ihre Frage..."
      />
      <BaseButton variant="primary" @click="sendMessage">
        Abschicken
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  UserCircleIcon,
} from "@heroicons/vue/16/solid";
import { MsgStatus, Sender, useAiAgentStore } from "../../stores/ai-agent";
import BaseButton from "../../components/presentation-components/BaseButton.vue";

const aiAgentStore = useAiAgentStore();

const input = ref("");

onMounted(() => {
  aiAgentStore.connect();
});

const getMessageColor = (msgStatus: MsgStatus) => {
  return msgStatus === MsgStatus.Success ? "ring-gray-200" : "ring-red-200";
};

function sendMessage() {
  aiAgentStore.sendMessage(input.value);
  input.value = "";
}
</script>
