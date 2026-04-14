import type {
  LanguageTextDto,
  PagingParamsDto,
  PassportPaginationDto,
  PassportRequestCreateDto,
} from "@open-dpp/dto";
import type { PagingResult } from "./pagination.ts";
import { Populates } from "@open-dpp/dto";
import { match, P } from "ts-pattern";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "../stores/http-codes.ts";

export function usePassports() {
  const passports = ref<PassportPaginationDto>();
  const loading = ref(false);
  const route = useRoute();
  const router = useRouter();

  const fetchPassports = async (pagingParams: PagingParamsDto): Promise<PagingResult> => {
    loading.value = true;
    const response = await apiClient.dpp.passports.getAll({
      ...pagingParams,
      populate: [Populates.assetAdministrationShells],
    });
    passports.value = response.data;
    loading.value = false;
    return response.data;
  };

  const createPassport = async (
    params: { templateId: string } | { displayName: LanguageTextDto[] },
  ) => {
    const body = match(params)
      .returnType<PassportRequestCreateDto>()
      .with({ templateId: P.string }, ({ templateId }) => ({
        templateId,
      }))
      .otherwise((data) => ({
        environment: {
          assetAdministrationShells: [{ ...data }],
        },
      }));
    const response = await apiClient.dpp.passports.create(body);
    if (response.status === HTTPCode.CREATED) {
      await router.push(`${route.path}/${response.data.id}`);
    }
    return response.data;
  };

  return { createPassport, fetchPassports, passports, loading };
}
