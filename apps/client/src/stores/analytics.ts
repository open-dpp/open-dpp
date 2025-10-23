import type {
  PassportMeasurementDto,
  PassportMetricQueryDto,
} from "@open-dpp/api-client";
import { TimePeriod } from "@open-dpp/api-client";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { z } from "zod/v4";
import apiClient from "../lib/api-client";
import { i18n } from "../translations/i18n";
import { useErrorHandlingStore } from "./error.handling";

dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
export const useAnalyticsStore = defineStore("analytics", () => {
  const route = useRoute();
  const { t } = i18n.global;

  const requestedTimePeriod = ref<TimePeriod>(TimePeriod.DAY);
  const passportMeasurements = ref<PassportMeasurementDto[]>([]);
  const errorHandlingStore = useErrorHandlingStore();

  const queryMetric = async (query: Omit<PassportMetricQueryDto, "timezone">) => {
    requestedTimePeriod.value = z.enum(TimePeriod).parse(query.period);
    try {
      const response = await apiClient.analytics.passportMetric.query(
        { ...query, timezone: dayjs.tz.guess() },
      );
      passportMeasurements.value = response.data;
    }
    catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("analytics.loadingMetricError"),
        error,
      );
    }
  };

  const addPageView = async () => {
    const permalink = String(route.params.permalink);
    const location = window.location;
    await apiClient.analytics.passportMetric.addPageView({
      uuid: permalink,
      page: location.href,
    });
  };

  const getXLabel = (isoDateString: string) => {
    const format: { [key in TimePeriod]: string } = {
      [TimePeriod.HOUR]: "HH:mm:ss",
      [TimePeriod.DAY]: "dddd",
      [TimePeriod.WEEK]: "w",
      [TimePeriod.MONTH]: "MMMM",
      [TimePeriod.YEAR]: "YYYY",
    };
    return dayjs(isoDateString, undefined, dayjs.tz.guess()).format(format[requestedTimePeriod.value]);
  };

  const getMeasurementsAsTimeseries = () => {
    return passportMeasurements.value.map(m => ({
      x: getXLabel(m.datetime),
      y: m.sum,
    }));
  };

  return {
    addPageView,
    queryMetric,
    getMeasurementsAsTimeseries,
    requestedTimePeriod,
  };
});
