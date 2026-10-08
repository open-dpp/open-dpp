import { PassportFilterParamsDto, PassportRegistryExportRequestDto } from '@open-dpp/dto';
import { isAxiosError } from "axios";
import dayjs from "dayjs";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { useNotificationStore } from "../stores/notification.ts";
import { useZip } from "./zip.ts";

/**
 * Downloads the published passports matching the filter as ZIP of EU registry files.
 * Success and failure are reported as notifications.
 */
export function useRegistryExport() {
  const { t } = useI18n();
  const notificationStore = useNotificationStore();
  const errorHandlingStore = useErrorHandlingStore();
  const { downloadZip } = useZip();
  const exporting = ref(false);

  /** Returns whether the ZIP was downloaded. */
  async function exportToRegistry(filter: PassportRegistryExportRequestDto): Promise<boolean> {
    if (exporting.value) return false;
    exporting.value = true;
    try {
      const { templateIds, startDate, endDate } = filter;
      const response = await apiClient.dpp.passports.exportToRegistry({
        templateIds,
        startDate,
        endDate,
      });
      downloadZip(response.data, `eu-registry-export-${dayjs().format("YYYY-MM-DD")}.zip`);
      notificationStore.addSuccessNotification(
        t("passports.registryExport.success"),
        undefined,
        10000,
      );
      return true;
    } catch (error) {
      const message =
        isAxiosError(error) && error.response?.status === HTTPCode.NOT_FOUND
          ? t("passports.registryExport.noMatch")
          : t("passports.registryExport.error");
      errorHandlingStore.logErrorWithNotification(message, error);
      return false;
    } finally {
      exporting.value = false;
    }
  }

  return { exporting, exportToRegistry };
}
