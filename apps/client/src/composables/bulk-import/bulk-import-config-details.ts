import { ref } from "vue";

export function useBulkImportConfigDetails() {
  const configName = ref("");
  const idField = ref<string | null>(null);

  function reset() {
    configName.value = "";
    idField.value = null;
  }

  return {
    configName,
    idField,
    reset,
  };
}
