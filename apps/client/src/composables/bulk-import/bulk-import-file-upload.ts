import type { FileUploadSelectEvent } from "primevue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import type { BulkImportParseResultDto, BulkImportRowDto } from "@open-dpp/dto";
import axios from "axios";

export function useBulkImportFileUpload() {
  const { t } = useI18n();

  const parsedRows = ref<BulkImportRowDto[]>([]);
  const selectedFile = ref<File | null>(null);
  const fileError = ref<string | null>(null);
  const isLoading = ref(false);

  const firstRow = computed<BulkImportRowDto | null>(() => parsedRows.value[0] ?? null);

  async function onFileSelect(event: FileUploadSelectEvent) {
    fileError.value = null;
    const file = event.files?.[0] as File | undefined;
    if (!file) return;

    selectedFile.value = file;
    isLoading.value = true;
    let response = null;
    try {
      response = await apiClient.dpp.bulkImport.parseFile(file);
      const result: BulkImportParseResultDto = response.data;
      parsedRows.value = result.rows;
    } catch (error: any) {
      const errorMsg = t("integrations.bulkImport.invalidFile");
      if (axios.isAxiosError(error)) {
        const errorJson = error.response?.data;
        fileError.value = errorJson?.message ? `${errorMsg}:\n${errorJson.message}` : errorMsg;
      } else {
        fileError.value = errorMsg;
      }
      parsedRows.value = [];
      selectedFile.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  function reset() {
    parsedRows.value = [];
    selectedFile.value = null;
    fileError.value = null;
    isLoading.value = false;
  }

  return {
    parsedRows,
    selectedFile,
    fileError,
    firstRow,
    isLoading,
    onFileSelect,
    reset,
  };
}
