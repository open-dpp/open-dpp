import type {
  AiConfigurationDto,
  AiConfigurationUpsertDto,
} from "@open-dpp/api-client";
import { AxiosError } from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client";
import { useErrorHandlingStore } from "./error.handling";
import { useNotificationStore } from "./notification";

export const useAiIntegrationStore = defineStore("ai-integration", () => {
  const configuration = ref<AiConfigurationDto>();
  const notificationStore = useNotificationStore();
  const errorHandlingStore = useErrorHandlingStore();
  const fetchConfiguration = async () => {
    try {
      const response = await apiClient.agentServer.aiConfigurations.get();
      configuration.value = response.data;
    }
    catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        console.error("Configuration not found.");
      }
      else {
        errorHandlingStore.logErrorWithNotification(
          "Laden der Konfiguration fehlgeschlagen:",
          error,
        );
      }
    }
  };

  const modifyConfiguration = async (
    upsertConfiguration: AiConfigurationUpsertDto,
  ) => {
    try {
      const response
        = await apiClient.agentServer.aiConfigurations.upsert(
          upsertConfiguration,
        );
      configuration.value = response.data;
      notificationStore.addSuccessNotification(
        "Konfiguration erfolgreich gespeichert.",
      );
    }
    catch (error) {
      errorHandlingStore.logErrorWithNotification(
        "Anpassung der Konfiguration fehlgeschlagen:",
        error,
      );
    }
  };

  return { configuration, fetchConfiguration, modifyConfiguration };
});
