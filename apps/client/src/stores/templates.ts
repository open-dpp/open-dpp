import type { ModelDto } from "@open-dpp/api-client";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useTemplatesStore = defineStore("templates", () => {
  const models = ref<ModelDto[]>([]);

  return { models };
});
