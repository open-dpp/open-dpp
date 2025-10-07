import { defineStore } from "pinia";
import { ref } from "vue";
import {
  PassportMeasurementDto,
  PassportMetricQueryDto,
} from "@open-dpp/api-client";
import { useErrorHandlingStore } from "./error.handling";
import apiClient from "../lib/api-client";

export const useAnalyticsStore = defineStore("analytics", () => {
  const passportMeasurements = ref<PassportMeasurementDto[]>();
  const errorHandlingStore = useErrorHandlingStore();
  const queryMetric = async (query: PassportMetricQueryDto) => {
    try {
      const response = await apiClient.analytics.passportMetric.query(query);
      passportMeasurements.value = response.data;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        "Laden der Analysemetric fehlgeschlagen:",
        error,
      );
    }
  };
  return {
    queryMetric,
    passportMeasurements,
  };
});
