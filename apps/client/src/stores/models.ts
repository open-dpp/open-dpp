import type { ModelCreateDto, ModelDto } from "@open-dpp/api-client";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client";
import { useErrorHandlingStore } from "./error.handling";

export const useModelsStore = defineStore("models", () => {
  const models = ref<ModelDto[]>([]);
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = i18n.global;

  const getModels = async () => {
    try {
      const response = await apiClient.dpp.models.getAll();
      models.value = response.data;
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(t('notifications.error'), e);
    }
  };

  const getModelById = async (id: string) => {
    const response = await apiClient.dpp.models.getById(id);
    return response.data;
  };

  const createModel = async (data: ModelCreateDto) => {
    const response = await apiClient.dpp.models.create(data);
    return response.data;
  };

  return { models, getModels, getModelById, createModel };
});
