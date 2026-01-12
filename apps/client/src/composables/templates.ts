import type { PagingParamsDto, TemplatePaginationDto } from "@open-dpp/dto";
import type { PagingResult } from "./pagination.ts";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { usePagination } from "./pagination.ts";

interface TemplateProps {
  initialCursor?: string;
  changeQueryParams: (params: Record<string, string>) => void;
}

export function useTemplates({ changeQueryParams, initialCursor }: TemplateProps) {
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
  const pagination = usePagination({ initialCursor, limit: 10, fetchCallback: fetchTemplates, changeQueryParams });

  async function init() {
    await pagination.nextPage();
  }

  const createTemplate = async () => {
    const response = await apiClient.dpp.templates.create();
    if (response.status === HTTPCode.CREATED) {
      await router.push(`${route.path}/${response.data.id}`);
    }
  };

  return { createTemplate, templates, loading, init, ...pagination };
}
