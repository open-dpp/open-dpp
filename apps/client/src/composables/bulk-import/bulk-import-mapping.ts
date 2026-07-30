import type { SubmodelResponseDto } from "@open-dpp/dto";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import type { IdShortPathOption } from "../../lib/id-short-path-select.ts";

export interface MappingRow {
  input: string;
  submodelIdShort: string;
  output: string;
}

export function useBulkImportMapping() {
  const { t } = useI18n();
  const errorHandlingStore = useErrorHandlingStore();

  const selectedTemplateId = ref<string | null>(null);
  const submodels = ref<SubmodelResponseDto[]>([]);
  const submodelsLoading = ref(false);

  const mappings = ref<MappingRow[]>([]);
  const draftInput = ref<string | null>(null);
  const draftTarget = ref<IdShortPathOption | null>(null);

  const submodelLabelById = computed(() => {
    const map = new Map<string, string>();
    for (const submodel of submodels.value) {
      map.set(submodel.id, submodel.idShort);
    }
    return map;
  });

  async function onTemplateSelected() {
    submodels.value = [];
    mappings.value = [];
    if (!selectedTemplateId.value) return;
    submodelsLoading.value = true;
    try {
      const response = await apiClient.dpp.templates.aas.getSubmodels(selectedTemplateId.value, {
        limit: 100,
      });
      submodels.value = response.data.result;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("integrations.bulkImport.errorLoadSubmodels"),
        error,
      );
    } finally {
      submodelsLoading.value = false;
    }
  }

  function addMapping() {
    if (!draftInput.value || !draftTarget.value) return;
    const submodelIdShort =
      submodelLabelById.value.get(draftTarget.value.submodelIdShort) ??
      draftTarget.value.submodelIdShort;
    mappings.value.push({
      input: draftInput.value,
      submodelIdShort,
      output: draftTarget.value.output,
    });
    draftInput.value = null;
    draftTarget.value = null;
  }

  function removeMapping(index: number) {
    mappings.value.splice(index, 1);
  }

  function reset() {
    selectedTemplateId.value = null;
    submodels.value = [];
    submodelsLoading.value = false;
    mappings.value = [];
    draftInput.value = null;
    draftTarget.value = null;
  }

  return {
    selectedTemplateId,
    submodels,
    submodelsLoading,
    submodelLabelById,
    mappings,
    draftInput,
    draftTarget,
    onTemplateSelected,
    addMapping,
    removeMapping,
    reset,
  };
}
