import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client";

export const useStatusStore = defineStore("status", () => {
  const version = ref<string | null>(null);

  const fetchStatus = async () => {
    try {
      const { data } = await apiClient.status.get();
      version.value = data.version;
    }
    catch {
      // Silently swallow — no error shown to the user
    }
  };

  return { version, fetchStatus };
});
