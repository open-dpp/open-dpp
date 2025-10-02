import type {
  AasConnectionGetAllDto,
  CreateAasConnectionDto,
} from "@open-dpp/api-client";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client";
import { useErrorHandlingStore } from "./error.handling";

export const useAasConnectionStore = defineStore("aas-integration", () => {
  const aasConnections = ref<AasConnectionGetAllDto[]>([]);
  const errorHandlingStore = useErrorHandlingStore();
  const fetchConnections = async () => {
    try {
      const response = await apiClient.dpp.aasIntegration.getAllConnections();
      aasConnections.value = response.data;
    }
    catch (error) {
      errorHandlingStore.logErrorWithNotification(
        "Laden der Verbindungen fehlgeschlagen:",
        error,
      );
    }
  };

  const createConnection = async (data: CreateAasConnectionDto) => {
    const response = await apiClient.dpp.aasIntegration.createConnection(data);
    return response.data;
  };

  return {
    aasConnections,
    fetchConnections,
    createConnection,
  };
});
