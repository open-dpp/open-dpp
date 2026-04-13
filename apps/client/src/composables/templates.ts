import type { LanguageTextDto, PagingParamsDto, TemplatePaginationDto } from "@open-dpp/dto";
import type { Ref } from "vue";
import type { IPagination, PagingResult } from "./pagination.ts";
import {

  Populates,

} from "@open-dpp/dto";
import { useConfirm } from "primevue/useconfirm";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { usePagination } from "./pagination.ts";

export interface TemplateProps {
  initialCursor?: string;
  changeQueryParams: (params: Record<string, string | undefined>) => void;
}

export type CreateTemplateCallback = (data: { displayName: LanguageTextDto[] }) => Promise<void>;

export interface ITemplateComposables extends IPagination {
  createTemplate: CreateTemplateCallback;
  templates: Ref<TemplatePaginationDto | undefined>;
  deleteTemplate: (id: string, onDeleted: () => Promise<void>) => Promise<void>;
  loading: Ref<boolean>;
  init: () => Promise<void>;
}

export function useTemplates({ changeQueryParams, initialCursor }: TemplateProps): ITemplateComposables {
  const templates = ref<TemplatePaginationDto>();
  const loading = ref(false);
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const errorHandlingStore = useErrorHandlingStore();
  const confirm = useConfirm();

  const fetchTemplates = async (pagingParams: PagingParamsDto): Promise<PagingResult> => {
    loading.value = true;
    try {
      const response = await apiClient.dpp.templates.getAll(
        { ...pagingParams, populate: [Populates.assetAdministrationShells] },
      );
      templates.value = response.data;
      return response.data;
    }
    finally {
      loading.value = false;
    }
  };
  const pagination = usePagination({ initialCursor, limit: 10, fetchCallback: fetchTemplates, changeQueryParams });

  async function init() {
    await pagination.nextPage();
  }

  const createTemplate = async (data: { displayName: LanguageTextDto[] }) => {
    const response = await apiClient.dpp.templates.create({
      environment: {
        assetAdministrationShells: [
          { displayName: data.displayName },
        ],
      },
    });
    if (response.status === HTTPCode.CREATED) {
      await router.push(`${route.path}/${response.data.id}`);
    }
  };

  async function deleteTemplate(id: string, onDeleted: () => Promise<void>) {
    const errorMessage = t("templates.errorDelete");
    const removeLabel = t("common.remove");
    const cancelLabel = t("common.cancel");

    confirm.require({
      message: t(`templates.delete`),
      header: removeLabel,
      icon: "pi pi-info-circle",
      rejectLabel: cancelLabel,
      rejectProps: {
        label: cancelLabel,
        severity: "secondary",
        outlined: true,
      },
      acceptProps: {
        label: removeLabel,
        severity: "danger",
      },
      accept: async () => {
        try {
          const response = await apiClient.dpp.templates.deleteById(id);
          if (response.status === HTTPCode.NO_CONTENT) {
            await onDeleted();
          }
          else {
            errorHandlingStore.logErrorWithNotification(errorMessage);
          }
        }
        catch (e) {
          errorHandlingStore.logErrorWithNotification(errorMessage, e);
        }
      },
    });
  }

  return { createTemplate, deleteTemplate, templates, loading, init, ...pagination };
}
