import { BulkImportRunStatusDto, type BulkImportRunItemPaginationDto, type PagingParamsDto } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { useNotificationStore } from "../../stores/notification.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import apiClient from "../../lib/api-client.ts";
import type { BulkImportRunCreateDto, BulkImportRunDto } from "@open-dpp/dto";

export function useBulkImportRunRepo() {
  const notificationStore = useNotificationStore();
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();

  const fetchRunsForConfig = async (configId: string) => {
    try {
      const response = await apiClient.dpp.bulkImport.getRunsForConfig(configId);
      return response.data.result;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorLoadRuns"),
        error,
      );
    }
  };

  const triggerRun = async (
    configId: string,
    rows: BulkImportRunCreateDto["rows"],
  ): Promise<BulkImportRunDto | undefined> => {
    try {
      const response = await apiClient.dpp.bulkImport.createRun(configId, { rows });
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

  const triggerRunUpload = async (
    configId: string,
    file: File,
  ): Promise<BulkImportRunDto | undefined> => {
    try {
      const response = await apiClient.dpp.bulkImport.createRunUpload(configId, file);
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
      return response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("integrations.bulkImport.errorLoadRun"), error);
    }
  };

  const fetchRunItems = async (
    runId: string,
    params?: PagingParamsDto,
  ): Promise<BulkImportRunItemPaginationDto | undefined> => {
    try {
      const response = await apiClient.dpp.bulkImport.getRunItems(runId, params);
      return response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorLoadRunItems"),
        error,
      );
    }
  };

  const isConfigEditable = async (configId: string): Promise<boolean> => {
    try {
      const runs = await fetchRunsForConfig(configId);
      if (!runs) return false;
      return !runs.some(
        (run) =>
          run.status === BulkImportRunStatusDto.Pending ||
          run.status === BulkImportRunStatusDto.Running,
      );
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorLoadRuns"),
        error,
      );
      return false;
    }
  };

  const interruptRun = async (runId: string): Promise<BulkImportRunDto | undefined> => {
    try {
      const response = await apiClient.dpp.bulkImport.interruptRun(runId);
      notificationStore.addSuccessNotification(t("integrations.bulkImport.interruptRunSuccess"));
      return response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorInterruptRun"),
        error,
      );
      return undefined;
    }
  };

  return {
    fetchRunsForConfig,
    isConfigEditable,
    triggerRun,
    triggerRunUpload,
    fetchRun,
    fetchRunItems,
    interruptRun,
  };
}
