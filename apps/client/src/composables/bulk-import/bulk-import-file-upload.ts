import type { FileUploadSelectEvent } from "primevue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

export function useBulkImportFileUpload() {
  const { t } = useI18n();

  const parsedRows = ref<Record<string, unknown>[]>([]);
  const fileError = ref<string | null>(null);

  const firstRow = computed<Record<string, unknown> | null>(() => parsedRows.value[0] ?? null);

  async function onFileSelect(event: FileUploadSelectEvent) {
    fileError.value = null;
    const file = event.files?.[0] as File | undefined;
    if (!file) return;
    try {
      const json: unknown = JSON.parse(await file.text());
      if (
        !Array.isArray(json) ||
        json.length === 0 ||
        !json.every((row) => typeof row === "object" && row !== null && !Array.isArray(row))
      ) {
        fileError.value = t("integrations.bulkImport.invalidFile");
        parsedRows.value = [];
        return;
      }
      parsedRows.value = json as Record<string, unknown>[];
    } catch {
      fileError.value = t("integrations.bulkImport.invalidFile");
      parsedRows.value = [];
    }
  }

  function reset() {
    parsedRows.value = [];
    fileError.value = null;
  }

  return {
    parsedRows,
    fileError,
    firstRow,
    onFileSelect,
    reset,
  };
}
