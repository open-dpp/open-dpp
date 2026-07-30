<script lang="ts" setup>
import { AasSubmodelElements } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import type { useBulkImportFileUpload } from "../../../composables/bulk-import/bulk-import-file-upload.ts";
import type { useBulkImportMapping } from "../../../composables/bulk-import/bulk-import-mapping.ts";
import IdShortPathSelect from "../../aas/IdShortPathSelect.vue";
import JsonPathSelect from "../../json/JsonPathSelect.vue";
import MappingsDataTable from "../MappingsDataTable.vue";

const props = defineProps<{
  fileUpload: ReturnType<typeof useBulkImportFileUpload>;
  mapping: ReturnType<typeof useBulkImportMapping>;
}>();

const { t } = useI18n();

// File properties can't be populated from a bulk-import row, and SubmodelElementList entries
// aren't addressable by a stable idShort, so both are excluded as mapping targets.
const excludedTargetModelTypes = [
  AasSubmodelElements.File,
  AasSubmodelElements.SubmodelElementList,
];
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-end gap-2">
      <label class="flex flex-1 flex-col gap-2">
        <JsonPathSelect
          :row="props.fileUpload.firstRow.value"
          v-model="props.mapping.draftInput.value"
          :label="t('integrations.bulkImport.inputField')"
        />
      </label>
      <label class="flex flex-1 flex-col gap-2">
        <IdShortPathSelect
          :submodels="props.mapping.submodels.value"
          :exclude-model-types="excludedTargetModelTypes"
          v-model="props.mapping.draftTarget.value"
          :label="t('integrations.bulkImport.targetField')"
        />
      </label>
      <Button
        icon="pi pi-plus"
        :disabled="!props.mapping.draftInput.value || !props.mapping.draftTarget.value"
        @click="props.mapping.addMapping"
      />
    </div>

    <MappingsDataTable
      :mappings="props.mapping.mappings.value"
      :on-remove-mapping="props.mapping.removeMapping"
    />
  </div>
</template>
