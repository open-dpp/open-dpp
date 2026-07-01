import type {
  CreateGs1UniqueProductIdentifierRequest,
  UniqueProductIdentifierListItemDto,
} from "@open-dpp/dto";
import type { PagingParamsDto } from "@open-dpp/dto";
import { ref } from "vue";

import apiClient from "../lib/api-client.ts";
import type { PagingResult } from "./pagination.ts";

export function useUniqueProductIdentifiers() {
  const upis = ref<UniqueProductIdentifierListItemDto[]>([]);
  const loading = ref(false);

  const fetchUniqueProductIdentifiers = async (
    passportId: string,
    pagingParams: PagingParamsDto,
  ): Promise<PagingResult> => {
    loading.value = true;
    try {
      const response = await apiClient.dpp.passports.getUniqueProductIdentifiers(
        passportId,
        pagingParams,
      );
      // The passport-scoped endpoint returns the standard cursor envelope
      // ({ paging_metadata, result }). Expose the rows directly and surface the
      // next-page cursor for the pagination composable.
      const items = (response.data?.result ?? []) as UniqueProductIdentifierListItemDto[];
      const cursor = response.data?.paging_metadata?.cursor ?? null;
      upis.value = items;
      return { paging_metadata: { cursor }, result: items };
    } finally {
      loading.value = false;
    }
  };

  const createGs1Upi = async (
    data: CreateGs1UniqueProductIdentifierRequest,
  ): Promise<UniqueProductIdentifierListItemDto> => {
    loading.value = true;
    try {
      const response = await apiClient.dpp.uniqueProductIdentifiers.create(data);
      return response.data as UniqueProductIdentifierListItemDto;
    } finally {
      loading.value = false;
    }
  };

  const createInternalUpi = async (
    passportId: string,
  ): Promise<UniqueProductIdentifierListItemDto> => {
    loading.value = true;
    try {
      const response = await apiClient.dpp.uniqueProductIdentifiers.createInternal({
        referenceId: passportId,
      });
      return response.data as UniqueProductIdentifierListItemDto;
    } finally {
      loading.value = false;
    }
  };

  const deleteUpi = async (uuid: string): Promise<void> => {
    loading.value = true;
    try {
      await apiClient.dpp.uniqueProductIdentifiers.delete(uuid);
    } finally {
      loading.value = false;
    }
  };

  return {
    upis,
    loading,
    fetchUniqueProductIdentifiers,
    createGs1Upi,
    createInternalUpi,
    deleteUpi,
  };
}
