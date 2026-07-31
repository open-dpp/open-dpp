import type { FileUploadSelectEvent } from "primevue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import type { BulkImportParseResultDto, BulkImportRowDto } from "@open-dpp/dto";

export function useBulkImportFileUpload() {
  const { t } = useI18n();

  const parsedRows = ref<BulkImportRowDto[]>([]);
  const fileError = ref<string | null>(null);
  const isLoading = ref(false);

  const firstRow = computed<BulkImportRowDto | null>(() => parsedRows.value[0] ?? null);

  async function onFileSelect(event: FileUploadSelectEvent) {
    fileError.value = null;
    const file = event.files?.[0] as File | undefined;
    if (!file) return;

    isLoading.value = true;
    try {
      const response = await apiClient.dpp.bulkImport.parseFile(file);
      const result: BulkImportParseResultDto = response.data;
      parsedRows.value = result.rows;
    } catch {
      fileError.value = t("integrations.bulkImport.invalidFile");
      parsedRows.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function reset() {
    parsedRows.value = [];
    fileError.value = null;
    isLoading.value = false;
  }

  return {
    parsedRows,
    fileError,
    firstRow,
    isLoading,
    onFileSelect,
    reset,
  };
}
