<script lang="ts" setup>
import { AasSubmodelElements } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import type { useBulkImportFileUpload } from "../../../composables/bulk-import-file-upload.ts";
import type { useBulkImportMapping } from "../../../composables/bulk-import-mapping.ts";
import IdShortPathSelect from "../../aas/IdShortPathSelect.vue";
import JsonPathSelect from "../../json/JsonPathSelect.vue";

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
        <span>{{ t("integrations.bulkImport.inputField") }}</span>
        <JsonPathSelect
          :row="props.fileUpload.firstRow.value"
          v-model="props.mapping.draftInput.value"
          :placeholder="t('integrations.bulkImport.inputField')"
        />
      </label>
      <label class="flex flex-1 flex-col gap-2">
        <span>{{ t("integrations.bulkImport.targetField") }}</span>
        <IdShortPathSelect
          :submodels="props.mapping.submodels.value"
          :exclude-model-types="excludedTargetModelTypes"
          v-model="props.mapping.draftTarget.value"
          :placeholder="t('integrations.bulkImport.targetField')"
        />
      </label>
      <Button
        icon="pi pi-plus"
        :disabled="!props.mapping.draftInput.value || !props.mapping.draftTarget.value"
        @click="props.mapping.addMapping"
      />
    </div>

    <DataTable :value="props.mapping.mappings.value">
      <Column field="input" :header="t('integrations.bulkImport.inputField')" />
      <Column field="submodelIdShort" :header="t('integrations.bulkImport.template')" />
      <Column field="output" :header="t('integrations.bulkImport.targetField')" />
      <Column>
        <template #body="{ index }">
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            :aria-label="t('integrations.bulkImport.delete')"
            @click="props.mapping.removeMapping(index)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
