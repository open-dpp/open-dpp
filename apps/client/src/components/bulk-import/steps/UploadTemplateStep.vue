<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import type { useBulkImportFileUpload } from "../../../composables/bulk-import-file-upload.ts";
import type { useBulkImportMapping } from "../../../composables/bulk-import-mapping.ts";
import TemplateSelect from "../../template/TemplateSelect.vue";

const props = defineProps<{
  fileUpload: ReturnType<typeof useBulkImportFileUpload>;
  mapping?: ReturnType<typeof useBulkImportMapping>;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-4">
    <FileUpload
      mode="basic"
      :auto="true"
      accept=".json"
      :choose-label="t('integrations.bulkImport.chooseFile')"
      custom-upload
      @select="props.fileUpload.onFileSelect"
    />
    <span v-if="props.fileUpload.fileError.value" class="text-red-500">
      {{ props.fileUpload.fileError.value }}
    </span>
    <span
      v-else-if="props.fileUpload.parsedRows.value.length > 0"
      class="text-surface-500 dark:text-surface-400"
    >
      {{ t("integrations.bulkImport.rowsParsed", { count: props.fileUpload.parsedRows.value.length }) }}
    </span>

    <label v-if="props.mapping" class="flex flex-col gap-2">
      <span>{{ t("integrations.bulkImport.selectTemplate") }}</span>
      <TemplateSelect
        v-model="props.mapping.selectedTemplateId.value"
        @update:model-value="props.mapping.onTemplateSelected"
      />
    </label>
  </div>
</template>
