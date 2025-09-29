import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../lib/api-client';
import {
  AasConnectionGetAllDto,
  CreateAasConnectionDto,
} from '@open-dpp/api-client';
import { useErrorHandlingStore } from './error.handling';
import { i18n } from '../translations/i18n';

export const useAasConnectionStore = defineStore('aas-integration', () => {
  const { t } = i18n.global;
  const aasConnections = ref<AasConnectionGetAllDto[]>([]);
  const errorHandlingStore = useErrorHandlingStore();
  const fetchConnections = async () => {
    try {
      const response = await apiClient.dpp.aasIntegration.getAllConnections();
      aasConnections.value = response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t('integrations.connections.errorLoad'),
        error,
      );
    }
  };

  const createConnection = async (data: CreateAasConnectionDto) => {
    const response = await apiClient.dpp.aasIntegration.createConnection(data);
    return response.data;
  };

  return {
    aasConnections,
    fetchConnections,
    createConnection,
  };
});
