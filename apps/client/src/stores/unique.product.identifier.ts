import { GranularityLevel } from "@open-dpp/api-client";
import { defineStore } from "pinia";
import apiClient from "../lib/api-client";

export const useUniqueProductIdentifierStore = defineStore(
  "uniqueProductIdentifier",
  () => {
    const buildLinkToReferencedProduct = async (id: string) => {
      const response
        = await apiClient.dpp.uniqueProductIdentifiers.getReference(id);
      const reference = response.data;
      if (reference.granularityLevel === GranularityLevel.ITEM) {
        return `/organizations/${reference.organizationId}/models/${reference.modelId}/items/${reference.id}`;
      }
      if (reference.granularityLevel === GranularityLevel.MODEL) {
        return `/organizations/${reference.organizationId}/models/${reference.id}`;
      }
      throw new Error(
        `Unsupported granularity level: ${String(reference.granularityLevel as unknown)}`,
      );
    };

    return { buildLinkToReferencedProduct };
  },
);
