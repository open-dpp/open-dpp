import type {
  LanguageTextDto,
  PagingParamsDto,
  PassportPaginationDto,
  PassportRequestCreateDto,
} from "@open-dpp/dto";
import { useConfirm } from "primevue/useconfirm";
import type { PagingResult } from "./pagination.ts";
import { Populates } from "@open-dpp/dto";
import { match, P } from "ts-pattern";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { HTTPCode } from "../stores/http-codes.ts";

export function usePassports() {
  const passports = ref<PassportPaginationDto>();
  const loading = ref(false);
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const errorHandlingStore = useErrorHandlingStore();
  const confirm = useConfirm();

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

  async function deletePassport(id: string, onDeleted: () => Promise<void>) {
    const errorMessage = t("passports.errorDelete");
    const removeLabel = t("common.remove");
    const cancelLabel = t("common.cancel");

    confirm.require({
      message: t(`passports.delete`),
      header: removeLabel,
      icon: "pi pi-info-circle",
      rejectLabel: cancelLabel,
      rejectProps: {
        label: cancelLabel,
        severity: "secondary",
        outlined: true,
      },
      acceptProps: {
        label: removeLabel,
        severity: "danger",
      },
      accept: async () => {
        try {
          const response = await apiClient.dpp.passports.deleteById(id);
          if (response.status === HTTPCode.NO_CONTENT) {
            await onDeleted();
          }
          else {
            errorHandlingStore.logErrorWithNotification(errorMessage);
          }
        }
        catch (e) {
          errorHandlingStore.logErrorWithNotification(errorMessage, e);
        }
      },
    });
  }

  return { createPassport, fetchPassports, passports, loading, deletePassport };
}
