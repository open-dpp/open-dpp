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
    catch (error) {
      // Log but do not surface to the user — version is non-critical UI.
      console.warn("Failed to fetch application status:", error);
    }
  };

  return { version, fetchStatus };
});
