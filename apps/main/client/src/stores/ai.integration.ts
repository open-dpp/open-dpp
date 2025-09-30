import { defineStore } from 'pinia';
import {
  AiConfigurationDto,
  AiConfigurationUpsertDto,
} from '@open-dpp/api-client';
import { ref } from 'vue';
import { useErrorHandlingStore } from './error.handling';
import apiClient from '../lib/api-client';
import { useNotificationStore } from './notification';
import { AxiosError } from 'axios';
import { i18n } from '../translations/i18n';

export const useAiIntegrationStore = defineStore('ai-integration', () => {
  const configuration = ref<AiConfigurationDto>();
  const notificationStore = useNotificationStore();
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = i18n.global;

  const fetchConfiguration = async () => {
    try {
      const response = await apiClient.agentServer.aiConfigurations.get();
      configuration.value = response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        console.error('Configuration not found.');
      } else {
        errorHandlingStore.logErrorWithNotification(
          t('integrations.ai.errorLoadingConfiguration'),
          error,
        );
      }
    }
  };

  const modifyConfiguration = async (
    upsertConfiguration: AiConfigurationUpsertDto,
  ) => {
    try {
      const response =
        await apiClient.agentServer.aiConfigurations.upsert(
          upsertConfiguration,
        );
      configuration.value = response.data;
      notificationStore.addSuccessNotification(
        t('integrations.ai.savedConfigurationSuccess'),
      );
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t('integrations.ai.modifyConfigurationError'),
        error,
      );
    }
  };

  return { configuration, fetchConfiguration, modifyConfiguration };
});
