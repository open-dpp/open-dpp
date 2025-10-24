import type {
  MeasurementType,
  PassportMeasurementDto,
} from "@open-dpp/api-client";
import { TimePeriod } from "@open-dpp/api-client";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { omit } from "lodash";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoute } from "vue-router";
import apiClient from "../lib/api-client";
import { getCurrentTimezone, getNowInCurrentTimezone } from "../lib/time.ts";
import { i18n } from "../translations/i18n";
import { useErrorHandlingStore } from "./error.handling";

export enum TimeView {
  DAYLY = "daylyView",
  WEEKLY = "weeklyView",
  MONTHLY = "monthlyView",
  YEARLY = "yearlyView",
}

dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);

export const useAnalyticsStore = defineStore("analytics", () => {
  const route = useRoute();
  const { t } = i18n.global;

  const requestedTimeView = ref<TimeView>(TimeView.DAYLY);
  const passportMeasurements = ref<PassportMeasurementDto[]>([]);
  const errorHandlingStore = useErrorHandlingStore();

  const getStartAndEndDate = (timeView: TimeView) => {
    const dateNow = getNowInCurrentTimezone();
    const now = dayjs(dateNow);
    const units: { [key in TimeView]: dayjs.OpUnitType } = {
      [TimeView.DAYLY]: "day",
      [TimeView.WEEKLY]: "week",
      [TimeView.MONTHLY]: "month",
      [TimeView.YEARLY]: "year",
    };

    const unit = units[timeView];
    return {
      startDate: now.startOf(unit).toDate(),
      endDate: now.endOf(unit).toDate(),
    };
  };

  const queryMetric = async (query: {
    templateId: string;
    modelId: string;
    valueKey: string;
    type: MeasurementType;
    selectedView: TimeView;
  }) => {
    requestedTimeView.value = query.selectedView;
    const { startDate, endDate } = getStartAndEndDate(requestedTimeView.value);
    const timePeriods: { [key in TimeView]: TimePeriod } = {
      [TimeView.DAYLY]: TimePeriod.HOUR,
      [TimeView.WEEKLY]: TimePeriod.DAY,
      [TimeView.MONTHLY]: TimePeriod.DAY,
      [TimeView.YEARLY]: TimePeriod.MONTH,
    };

    const timezone = getCurrentTimezone();
    try {
      const response = await apiClient.analytics.passportMetric.query({
        ...omit(query, "selectedView"),
        startDate,
        endDate,
        timezone,
        period: timePeriods[requestedTimeView.value],
      });
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
    const format: { [key in TimeView]: string } = {
      [TimeView.DAYLY]: "HH:mm:ss",
      [TimeView.WEEKLY]: "dddd",
      [TimeView.MONTHLY]: "DD.MM",
      [TimeView.YEARLY]: "MMMM",
    };
    return dayjs(isoDateString, undefined, getCurrentTimezone()).format(
      format[requestedTimeView.value],
    );
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
    requestedTimePeriod: requestedTimeView,
  };
});
