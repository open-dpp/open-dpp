import type { ModelCreateDto, ModelDto } from "@open-dpp/api-client";
import { AxiosError } from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client";
import { handleApiError, LimitError } from "../lib/api-error-mapping.ts";
import { i18n } from "../translations/i18n.ts";
import { useErrorHandlingStore } from "./error.handling";

export const useModelsStore = defineStore("models", () => {
  const models = ref<ModelDto[]>([]);
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = i18n.global;

  const getModels = async () => {
    try {
      const response = await apiClient.dpp.models.getAll();
      models.value = response.data;
    }
    catch (e) {
      errorHandlingStore.logErrorWithNotification(t("notifications.error"), e);
    }
  };

  const getModelById = async (id: string) => {
    const response = await apiClient.dpp.models.getById(id);
    return response.data;
  };

  const createModel = async (data: ModelCreateDto) => {
    try {
      const response = await apiClient.dpp.models.create(data);
      return response.data;
    }
    catch (e) {
      const err = handleApiError(e);
      if (err instanceof LimitError) {
        errorHandlingStore.logErrorWithNotification(t(`api.error.limit.${err.key}`, { limit: err.limit }), e);
      }
      else if (err instanceof AxiosError) {
        errorHandlingStore.logErrorWithNotification(t("notifications.error"), e);
      }
    }
  };

  return { models, getModels, getModelById, createModel };
});
