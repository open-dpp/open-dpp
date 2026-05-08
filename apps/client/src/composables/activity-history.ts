import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useI18n } from "vue-i18n";
import type { ActivityDto, PagingParamsDto } from "@open-dpp/dto";
import type { PagingResult } from "./pagination.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { type DigitalProductDocumentTypeType } from "../lib/digital-product-document.ts";
import { getDigitalProductDocNamespace } from "./digital-product-document.ts";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { z } from "zod";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
export function useActivityHistory(type: DigitalProductDocumentTypeType) {
  const activities = ref<ActivityDto[]>([]);
  const route = useRoute();
  const router = useRouter();

  const initialPeriod = () => {
    const dateParser = z.iso.datetime().optional();
    const startDate = dateParser.parse(route.query.startDate);
    const endDate = dateParser.parse(route.query.endDate);
    if (startDate && endDate) {
      return [new Date(startDate), new Date(endDate)];
    } else if (startDate) {
      return [new Date(startDate), null];
    } else if (endDate) {
      const end = dayjs(endDate);
      return [end.subtract(1, "month").toDate(), end.toDate()];
    } else {
      const now = dayjs().utc();
      return [now.subtract(1, "month").toDate(), now.toDate()];
    }
  };

  const period = ref<Date[] | (Date | null)[]>(initialPeriod());

  const digitalProductDocNamespace = getDigitalProductDocNamespace(type);
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();
  const prefix = "activityHistory";

  function periodToQueryParams() {
    const startDate = period.value[0] ? period.value[0].toISOString() : undefined;
    const endDate = period.value[1] ? period.value[1].toISOString() : undefined;
    return { startDate, endDate };
  }

  async function fetchActivities(
    id: string,
    pagination: PagingParamsDto = { limit: 10 },
  ): Promise<PagingResult> {
    const errorMessage = t(`${prefix}.errorLoading`);
    let pagingResult: PagingResult = { paging_metadata: { cursor: null }, result: [] };
    try {
      const response = await digitalProductDocNamespace.getActivities(id, {
        pagination,
        period: periodToQueryParams(),
      });
      if (response.status === HTTPCode.OK) {
        pagingResult = response.data;
      } else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
    activities.value = pagingResult.result;
    return pagingResult;
  }

  async function changePeriod(newPeriod: Date[] | (Date | null)[]) {
    period.value = newPeriod;
    await router.push({
      query: {
        ...route.query,
        ...periodToQueryParams(),
      },
    });
  }

  async function downloadActivities(id: string) {
    const errorMessage = t(`${prefix}.errorDownloading`);

    try {
      const response = await digitalProductDocNamespace.downloadActivities(id, {
        period: periodToQueryParams(),
      });
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

  return { period, changePeriod, fetchActivities, downloadActivities, activities };
}
