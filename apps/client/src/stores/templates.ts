import type { TemplatePaginationDto } from "@open-dpp/dto";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "./http-codes.ts";

type Cursor = string | null;
interface Page {
  nextCursor: Cursor;
}
export const useTemplatesStore = defineStore("templates", () => {
  const templates = ref<TemplatePaginationDto>();
  const loading = ref(false);
  const startPage = { nextCursor: null };

  const pages = ref<Page[]>([startPage]);

  const currentPage = ref<number>(0);

  const fetchTemplates = async (cursor?: string | null) => {
    loading.value = true;
    const response = await apiClient.dpp.templates.getAll({ cursor: cursor ?? undefined, limit: 10 });
    templates.value = response.data;
    loading.value = false;
  };

  const nextTemplates = async () => {
    if (templates.value) {
      pages.value.push({ nextCursor: templates.value.paging_metadata.cursor });
      currentPage.value++;
      await fetchTemplates(templates.value.paging_metadata.cursor);
    }
  };

  const previousTemplates = async () => {
    let prevPage: Page = startPage;
    if (currentPage.value > 0 && currentPage.value - 1 < pages.value.length) {
      prevPage = pages.value[currentPage.value - 1] ?? startPage;
      currentPage.value--;
    }
    await fetchTemplates(prevPage.nextCursor);
  };

  const createTemplate = async () => {
    const response = await apiClient.dpp.templates.create();
    if (response.status === HTTPCode.CREATED) {
      await fetchTemplates();
    }
  };

  return { createTemplate, fetchTemplates, previousTemplates, nextTemplates, templates, loading };
});
