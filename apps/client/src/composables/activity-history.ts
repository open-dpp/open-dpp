import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useI18n } from "vue-i18n";
import type { GetAllActivitiesParamsDto, PeriodDto } from "@open-dpp/dto";
import type { PagingResult } from "./pagination.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { type DigitalProductDocumentTypeType } from "../lib/digital-product-document.ts";
import { getDigitalProductDocNamespace } from "./digital-product-document.ts";

export function useActivityHistory(type: DigitalProductDocumentTypeType) {
  const digitalProductDocNamespace = getDigitalProductDocNamespace(type);
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();
  const prefix = "activityHistory";
  async function getActivities(
    id: string,
    { pagination = { limit: 10, cursor: undefined }, period }: GetAllActivitiesParamsDto,
  ): Promise<PagingResult> {
    const errorMessage = t(`${prefix}.errorLoading`);
    try {
      const response = await digitalProductDocNamespace.getActivities(id, { pagination, period });
      if (response.status === HTTPCode.OK) {
        return response.data;
      } else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
    return { paging_metadata: { cursor: null }, result: [] };
  }

  async function downloadActivities(id: string, period: PeriodDto) {
    const errorMessage = t(`${prefix}.errorDownloading`);

    try {
      const response = await digitalProductDocNamespace.downloadActivities(id, { period });
      if (response.status === HTTPCode.OK) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");

        link.href = url;
        link.setAttribute("download", "activities.zip");
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  return { getActivities, downloadActivities };
}
