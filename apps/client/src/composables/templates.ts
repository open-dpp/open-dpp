import {
  type FilterParamsDto,
  type LanguageTextDto,
  type PagingParamsDto,
  Populates,
  type TemplatePaginationDto,
} from "@open-dpp/dto";
import type { Ref } from "vue";
import { ref } from "vue";
import type { PagingResult } from "./pagination.ts";
import { useRoute, useRouter } from "vue-router";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "../stores/http-codes.ts";

export type CreateTemplateCallback = (data: { displayName: LanguageTextDto[] }) => Promise<void>;

export interface ITemplateComposables {
  createTemplate: CreateTemplateCallback;
  templates: Ref<TemplatePaginationDto | undefined>;
  loading: Ref<boolean>;
  fetchTemplates: (
    pagingParams: PagingParamsDto,
    filter: FilterParamsDto | undefined,
  ) => Promise<PagingResult>;
}

export function useTemplates(): ITemplateComposables {
  const templates = ref<TemplatePaginationDto>();
  const loading = ref(false);
  const route = useRoute();
  const router = useRouter();

  const fetchTemplates = async (
    pagingParams: PagingParamsDto,
    filter: FilterParamsDto | undefined = undefined,
  ): Promise<PagingResult> => {
    loading.value = true;
    try {
      const response = await apiClient.dpp.templates.getAll({
        pagination: pagingParams,
        populate: [Populates.assetAdministrationShells],
        ...(filter && { filter }),
      });
      templates.value = response.data;
      return response.data;
    } finally {
      loading.value = false;
    }
  };

  const createTemplate = async (data: { displayName: LanguageTextDto[] }) => {
    const response = await apiClient.dpp.templates.create({
      environment: {
        assetAdministrationShells: [{ displayName: data.displayName }],
      },
    });
    if (response.status === HTTPCode.CREATED) {
      await router.push(`${route.path}/${response.data.id}`);
    }
  };

  return {
    fetchTemplates,
    createTemplate,
    templates,
    loading,
  };
}
