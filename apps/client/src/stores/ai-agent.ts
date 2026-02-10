import type { Socket } from "socket.io-client";
import { defineStore } from "pinia";
import { io } from "socket.io-client";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { AGENT_WEBSOCKET_URL } from "../const";

export enum Sender {
  Bot = "Bot",
  User = "User",
}

export enum MsgStatus {
  Success = "Success",
  Error = "Error",
  Pending = "Pending",
}

export const useAiAgentStore = defineStore("socket", () => {
  const socket = ref<Socket | null>(null);
  const messages = ref<
    { id: number; sender: Sender; text: string; status: MsgStatus }[]
  >([]);
  const route = useRoute();
  const isLastMessagePendingFromBot = ref<boolean>(false);
  const { t } = useI18n();

  let listenersBound = false;
  const connect = () => {
    if (!AGENT_WEBSOCKET_URL) {
      console.error("AGENT_WEBSOCKET_URL is not set");
      return;
    }
    if (!socket.value) {
      socket.value = io(AGENT_WEBSOCKET_URL, {
        autoConnect: true,
        path: "/api/ai-socket",
      });
    }
    else if (!socket.value.connected) {
      socket.value.connect();
    }
    else {
      // already connected
      return;
    }
    if (!listenersBound && socket.value) {
      socket.value.on("botMessage", (msg: string) => {
        messages.value.pop();
        messages.value.push({
          id: Date.now(),
          sender: Sender.Bot,
          text: msg,
          status: MsgStatus.Success,
        });
        isLastMessagePendingFromBot.value = false;
      });
      socket.value.on("errorMessage", (msg: string) => {
        const text
          = msg === "AI is not enabled"
            ? "Die KI Funktion ist für diesen Produktpass nicht aktiviert"
            : `Es ist ein Fehler aufgetreten`;
        messages.value.push({
          id: Date.now(),
          sender: Sender.Bot,
          text,
          status: MsgStatus.Error,
        });
        isLastMessagePendingFromBot.value = false;
      });
      // surface connection errors to the console; optional: push a message
      socket.value.on("connect_error", (err) => {
        console.error("AI agent socket connect_error:", err.message);
      });
      socket.value.on("limitError", (err) => {
        messages.value.pop();
        messages.value.push({
          id: Date.now(),
          sender: Sender.Bot,
          text: err.msg,
          status: MsgStatus.Error,
        });
        isLastMessagePendingFromBot.value = false;
      });
      listenersBound = true;
    }
  };

  const clearMessages = () => {
    messages.value = [];
    isLastMessagePendingFromBot.value = false;
  };

  watch(
    () => route.params.permalink,
    (newPermalink, oldPermalink) => {
      if (oldPermalink !== newPermalink) {
        clearMessages();
      }
    },
    {
      immediate: true,
    },
  );

  const sendMessage = (msg: string) => {
    if (socket.value && !isLastMessagePendingFromBot.value) {
      socket.value.emit("userMessage", {
        msg,
        passportUUID: route.params.permalink,
      });
      messages.value.push({
        id: Date.now(),
        sender: Sender.User,
        text: msg,
        status: MsgStatus.Success,
      });
      messages.value.push({
        id: Date.now(),
        sender: Sender.Bot,
        text: t("presentation.answerPending"),
        status: MsgStatus.Pending,
      });
      isLastMessagePendingFromBot.value = true;
    }
  };

  return {
    messages,
    connect,
    clearMessages,
    sendMessage,
    isLastMessagePendingFromBot,
  };
});
