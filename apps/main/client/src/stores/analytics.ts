import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  PassportMeasurementDto,
  PassportMetricQueryDto,
  TimePeriod,
} from '@open-dpp/api-client';
import { useErrorHandlingStore } from './error.handling';
import apiClient from '../lib/api-client';
import { useRoute } from 'vue-router';
import { i18n } from '../translations/i18n';
import { z } from 'zod/v4';
import dayjs from 'dayjs';

export const useAnalyticsStore = defineStore('analytics', () => {
  const route = useRoute();
  const { t } = i18n.global;

  const requestedTimePeriod = ref<TimePeriod>(TimePeriod.DAY);
  const passportMeasurements = ref<PassportMeasurementDto[]>([]);
  const errorHandlingStore = useErrorHandlingStore();

  const queryMetric = async (query: PassportMetricQueryDto) => {
    requestedTimePeriod.value = z.enum(TimePeriod).parse(query.period);
    try {
      const response = await apiClient.analytics.passportMetric.query(query);
      passportMeasurements.value = response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t('analytics.loadingMetricError'),
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
    switch (requestedTimePeriod.value) {
      case TimePeriod.HOUR:
        return Array.from({ length: 24 }, (_, i) => {
          return dayjs().hour(i).format('HH:mm');
        });
      case TimePeriod.DAY:
        return Array.from({ length: 7 }, (_, i) => {
          return dayjs().day(i).format('dd');
        }).flat();
      case TimePeriod.WEEK:
        return dayjs(isoDateString).format('W');
      case TimePeriod.MONTH:
        return Array.from({ length: 12 }, (_, i) => {
          return dayjs().month(i).format('MM');
        });

      default:
        return dayjs(isoDateString).format('DD.MM.YYYY');
    }
  };

  const getMeasurementsAsTimeseries = () => {
    return passportMeasurements.value.map((m) => ({
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
