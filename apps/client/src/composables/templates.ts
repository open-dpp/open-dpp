import {
  type FilterParamsDto,
  type LanguageTextDto,
  type PagingParamsDto,
  Populates,
  type TemplatePaginationDto,
} from "@open-dpp/dto";
import type { Ref } from "vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import type { PagingResult } from "./pagination.ts";
import { useRoute, useRouter } from "vue-router";
import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { useNotificationStore } from "../stores/notification.ts";

export type CreateTemplateCallback = (data: { displayName: LanguageTextDto[] }) => Promise<void>;

export interface ITemplateComposables {
  createTemplate: CreateTemplateCallback;
  templates: Ref<TemplatePaginationDto | undefined>;
  loading: Ref<boolean>;
  fetchTemplates: (
    pagingParams: PagingParamsDto,
    filter: FilterParamsDto | undefined,
  ) => Promise<PagingResult>;
  importingOfficialTemplates: Ref<boolean>;
  importOfficialTemplates: () => Promise<void>;
}

export function useTemplates(): ITemplateComposables {
  const templates = ref<TemplatePaginationDto>();
  const loading = ref(false);
  const importingOfficialTemplates = ref(false);
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const notificationStore = useNotificationStore();
  const errorHandlingStore = useErrorHandlingStore();

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

  const importOfficialTemplates = async () => {
    importingOfficialTemplates.value = true;
    try {
      const response = await apiClient.dpp.templates.importOfficial();
      const { imported, failed } = response.data;
      if (failed.length > 0) {
        notificationStore.addWarningNotification(
          t("templates.importOfficialPartialFailure", {
            imported: imported.length,
            failed: failed.length,
          }),
        );
      } else {
        notificationStore.addSuccessNotification(
          t("templates.importOfficialSuccess", { imported: imported.length }),
        );
      }
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("templates.importOfficialError"), error);
    } finally {
      importingOfficialTemplates.value = false;
    }
  };

  return {
    fetchTemplates,
    createTemplate,
    templates,
    loading,
    importingOfficialTemplates,
    importOfficialTemplates,
  };
}
