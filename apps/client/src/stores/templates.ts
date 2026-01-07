import type { PagingParamsDto, TemplatePaginationDto } from "@open-dpp/dto";
import type { PagingResult } from "../composables/pagination.ts";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePagination } from "../composables/pagination.ts";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "./http-codes.ts";

export const useTemplatesStore = defineStore("templates", () => {
  const templates = ref<TemplatePaginationDto>();
  const loading = ref(false);
  const route = useRoute();
  const router = useRouter();

  const fetchTemplates = async (pagingParams: PagingParamsDto): Promise<PagingResult> => {
    loading.value = true;
    const response = await apiClient.dpp.templates.getAll(pagingParams);
    templates.value = response.data;
    loading.value = false;
    return response.data;
  };
  const { previousPage, nextPage, currentPage } = usePagination({ limit: 10, fetchCallback: fetchTemplates });

  const nextTemplates = async () => {
    await nextPage();
  };

  const previousTemplates = async () => {
    await previousPage();
  };

  const createTemplate = async () => {
    const response = await apiClient.dpp.templates.create();
    if (response.status === HTTPCode.CREATED) {
      await router.push(`${route.path}/${response.data.id}`);
    }
  };

  return { createTemplate, previousTemplates, nextTemplates, currentPage, templates, loading };
});
