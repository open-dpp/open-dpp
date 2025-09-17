import { defineStore } from "pinia";
import { ref } from "vue";

export const useIndexStore = defineStore("index", () => {
  const view = ref<"all" | "manufacturer" | "compliance" | "client">("client");

  return { view };
});
