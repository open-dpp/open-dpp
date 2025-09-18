import { defineStore } from "pinia";
import { io, type Socket } from "socket.io-client";
import { ref } from "vue";
import { AGENT_SERVER_URL } from "../const";
import { useRoute } from "vue-router";

export enum Sender {
  Bot = "Bot",
  User = "User",
}

export enum MsgStatus {
  Success = "Success",
  Error = "Error",
}

export const useAiAgentStore = defineStore("socket", () => {
  const socket = ref<Socket | null>(null);
  const messages = ref<
    { id: number; sender: Sender; text: string; status: MsgStatus }[]
  >([]);
  const route = useRoute();

  let listenersBound = false;
  const connect = () => {
    if (!AGENT_SERVER_URL) {
      console.error("AGENT_SERVER_URL is not set");
      return;
    }
    if (!socket.value) {
      socket.value = io(AGENT_SERVER_URL, {
        autoConnect: true,
        path: "/ai-socket/socket.io",
      });
    } else if (!socket.value.connected) {
      socket.value.connect();
    } else {
      // already connected
      return;
    }
    if (!listenersBound && socket.value) {
      socket.value.on("botMessage", (msg: string) => {
        messages.value.push({
          id: Date.now(),
          sender: Sender.Bot,
          text: msg,
          status: MsgStatus.Success,
        });
      });
      socket.value.on("errorMessage", (msg: string) => {
        const text =
          msg === "AI is not enabled"
            ? "Die KI Funktion ist für diesen Produktpass nicht aktiviert"
            : `Es ist ein Fehler aufgetreten`;
        messages.value.push({
          id: Date.now(),
          sender: Sender.Bot,
          text,
          status: MsgStatus.Error,
        });
      });
      // surface connection errors to the console; optional: push a message
      socket.value.on("connect_error", (err) => {
        console.error("AI agent socket connect_error:", err.message);
      });
      listenersBound = true;
    }
  };

  const sendMessage = (msg: string) => {
    if (socket.value) {
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
    }
  };

  return {
    messages,
    connect,
    sendMessage,
  };
});
