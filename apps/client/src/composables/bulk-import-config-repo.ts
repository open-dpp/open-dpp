import { useI18n } from "vue-i18n";
import { useNotificationStore } from "../stores/notification.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import apiClient from "../lib/api-client.ts";
import type {
  BulkImportConfigCreateDto,
  BulkImportConfigDto,
  BulkImportConfigUpdateDto,
} from "@open-dpp/dto";

export function useBulkImportConfigRepo() {
  const notificationStore = useNotificationStore();
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();

  const fetchConfigs = async (templateId?: string) => {
    try {
      const response = await apiClient.dpp.bulkImport.getConfigs(templateId);
      return response.data.result;
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

  return {
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
  };
}
