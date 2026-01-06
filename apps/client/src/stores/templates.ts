import type { PagingParamsDto, TemplatePaginationDto } from "@open-dpp/dto";
import type { PagingResult } from "./pagination.ts";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "./http-codes.ts";
import { usePagination } from "./pagination.ts";

export const useTemplatesStore = defineStore("templates", () => {
  const templates = ref<TemplatePaginationDto>();
  const loading = ref(false);

  const fetchTemplates = async (pagingParams: PagingParamsDto): Promise<PagingResult> => {
    loading.value = true;
    const response = await apiClient.dpp.templates.getAll(pagingParams);
    templates.value = response.data;
    loading.value = false;
    return response.data;
  };
  const { previousPage, nextPage, currentPage, onAddItem } = usePagination({ limit: 10, fetchCallback: fetchTemplates });

  const nextTemplates = async () => {
    await nextPage();
  };

  const previousTemplates = async () => {
    await previousPage();
  };

  const createTemplate = async () => {
    const response = await apiClient.dpp.templates.create();
    if (response.status === HTTPCode.CREATED) {
      await onAddItem();
    }
  };

  return { createTemplate, previousTemplates, nextTemplates, currentPage, templates, loading };
});
