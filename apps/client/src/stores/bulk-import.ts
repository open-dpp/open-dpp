import type {
  BulkImportConfigCreateDto,
  BulkImportConfigDto,
  BulkImportConfigUpdateDto,
  BulkImportRunCreateDto,
  BulkImportRunDto,
  BulkImportRunItemDto,
} from "@open-dpp/dto";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client";
import { i18n } from "../translations/i18n.ts";
import { useErrorHandlingStore } from "./error.handling";
import { useNotificationStore } from "./notification";

export const useBulkImportStore = defineStore("bulk-import", () => {
  const configs = ref<BulkImportConfigDto[]>([]);
  const configRuns = ref<BulkImportRunDto[]>([]);
  const selectedRun = ref<BulkImportRunDto>();
  const runItems = ref<BulkImportRunItemDto[]>([]);

  const notificationStore = useNotificationStore();
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = i18n.global;

  const fetchConfigs = async (templateId?: string) => {
    try {
      const response = await apiClient.dpp.bulkImport.getConfigs(templateId);
      configs.value = response.data.result;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorLoadConfigs"),
        error,
      );
    }
  };

  const createConfig = async (
    data: BulkImportConfigCreateDto,
  ): Promise<BulkImportConfigDto | undefined> => {
    try {
      const response = await apiClient.dpp.bulkImport.createConfig(data);
      configs.value = [response.data, ...configs.value];
      notificationStore.addSuccessNotification(t("integrations.bulkImport.createConfigSuccess"));
      return response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorCreateConfig"),
        error,
      );
      return undefined;
    }
  };

  const updateConfig = async (
    id: string,
    data: BulkImportConfigUpdateDto,
  ): Promise<BulkImportConfigDto | undefined> => {
    try {
      const response = await apiClient.dpp.bulkImport.updateConfig(id, data);
      configs.value = configs.value.map((config) => (config.id === id ? response.data : config));
      notificationStore.addSuccessNotification(t("integrations.bulkImport.updateConfigSuccess"));
      return response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorUpdateConfig"),
        error,
      );
      return undefined;
    }
  };

  const deleteConfig = async (id: string): Promise<boolean> => {
    try {
      await apiClient.dpp.bulkImport.deleteConfig(id);
      configs.value = configs.value.filter((config) => config.id !== id);
      notificationStore.addSuccessNotification(t("integrations.bulkImport.deleteConfigSuccess"));
      return true;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorDeleteConfig"),
        error,
      );
      return false;
    }
  };

  const fetchRunsForConfig = async (configId: string) => {
    try {
      const response = await apiClient.dpp.bulkImport.getRunsForConfig(configId);
      configRuns.value = response.data.result;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("integrations.bulkImport.errorLoadRuns"), error);
    }
  };

  const triggerRun = async (
    configId: string,
    rows: BulkImportRunCreateDto["rows"],
  ): Promise<BulkImportRunDto | undefined> => {
    try {
      const response = await apiClient.dpp.bulkImport.createRun(configId, { rows });
      configRuns.value = [response.data, ...configRuns.value];
      notificationStore.addSuccessNotification(t("integrations.bulkImport.triggerRunSuccess"));
      return response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorTriggerRun"),
        error,
      );
      return undefined;
    }
  };

  const fetchRun = async (runId: string) => {
    try {
      const response = await apiClient.dpp.bulkImport.getRunById(runId);
      selectedRun.value = response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("integrations.bulkImport.errorLoadRun"), error);
    }
  };

  const fetchRunItems = async (runId: string) => {
    try {
      const response = await apiClient.dpp.bulkImport.getRunItems(runId);
      runItems.value = response.data.result;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorLoadRunItems"),
        error,
      );
    }
  };

  return {
    configs,
    configRuns,
    selectedRun,
    runItems,
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    fetchRunsForConfig,
    triggerRun,
    fetchRun,
    fetchRunItems,
  };
});
