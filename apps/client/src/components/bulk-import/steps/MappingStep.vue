<script lang="ts" setup>
import type { useBulkImportFileUpload } from "../../../composables/bulk-import/bulk-import-file-upload.ts";
import type { useBulkImportMapping } from "../../../composables/bulk-import/bulk-import-mapping.ts";
import MappingsDataTable from "../MappingsDataTable.vue";
import { computed } from "vue";
import { removeMappingsFromRow, removeMappingsFromSubmodels } from "../../../lib/bulk-import.ts";
import FieldMapping from "../FieldMapping.vue";

const props = defineProps<{
  fileUpload: ReturnType<typeof useBulkImportFileUpload>;
  mapping: ReturnType<typeof useBulkImportMapping>;
}>();

const rowJsonSelect = computed(() =>
  removeMappingsFromRow(props.fileUpload.firstRow, props.mapping.mappings.value),
);

const submodelsIdShortPathSelect = computed(() =>
  removeMappingsFromSubmodels(props.mapping.submodels.value, props.mapping.mappings.value),
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <FieldMapping
      :submodels="submodelsIdShortPathSelect"
      :selected-json-row="rowJsonSelect"
      v-model:selected-input-field="mapping.draftInput.value"
      v-model:selected-target-field="mapping.draftTarget.value"
      @on-add-mapping="mapping.addMapping"
    />
    <MappingsDataTable
      :mappings="props.mapping.mappings.value"
      :on-remove-mapping="props.mapping.removeMapping"
    />
  </div>
</template>
