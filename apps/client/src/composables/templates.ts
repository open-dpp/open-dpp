import {
  type DppStatusModificationDto,
  DppStatusModificationMethodDto,
  type FilterParamsDto,
  type LanguageTextDto,
  type PagingParamsDto,
  Populates,
  type TemplatePaginationDto,
} from "@open-dpp/dto";
import type { Ref } from "vue";
import { ref } from "vue";
import type { IPagination, PagingResult } from "./pagination.ts";
import { useConfirm } from "primevue/useconfirm";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { HTTPCode } from "../stores/http-codes.ts";

export type CreateTemplateCallback = (data: { displayName: LanguageTextDto[] }) => Promise<void>;

export interface ITemplateComposables {
  createTemplate: CreateTemplateCallback;
  templates: Ref<TemplatePaginationDto | undefined>;
  deleteTemplate: (id: string, onDeleted: () => Promise<void>) => Promise<void>;
  loading: Ref<boolean>;
  fetchTemplates: (
    pagingParams: PagingParamsDto,
    filter: FilterParamsDto | undefined,
  ) => Promise<PagingResult>;
  publish: (id: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
}

export function useTemplates(): ITemplateComposables {
  const templates = ref<TemplatePaginationDto>();
  const loading = ref(false);
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const errorHandlingStore = useErrorHandlingStore();
  const confirm = useConfirm();

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

  async function modifyStatus(id: string, data: DppStatusModificationDto) {
    const errorMessage = t("templates.errorModifyStatus");
    try {
      const response = await apiClient.dpp.templates.modifyStatus(id, data);
      if (response.status !== HTTPCode.OK) {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  async function publish(id: string) {
    await modifyStatus(id, { method: DppStatusModificationMethodDto.Publish });
  }

  async function archive(id: string) {
    await modifyStatus(id, { method: DppStatusModificationMethodDto.Archive });
  }

  async function restore(id: string) {
    await modifyStatus(id, { method: DppStatusModificationMethodDto.Restore });
  }

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
          } else {
            errorHandlingStore.logErrorWithNotification(errorMessage);
          }
        } catch (e) {
          errorHandlingStore.logErrorWithNotification(errorMessage, e);
        }
      },
    });
  }

  return {
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    templates,
    loading,
    publish,
    archive,
    restore,
  };
}
