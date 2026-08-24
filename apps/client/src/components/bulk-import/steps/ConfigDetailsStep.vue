<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import type { useBulkImportConfigDetails } from "../../../composables/bulk-import/bulk-import-config-details.ts";
import type { useBulkImportFileUpload } from "../../../composables/bulk-import/bulk-import-file-upload.ts";
import JsonPathSelect from "../../json/JsonPathSelect.vue";

const props = defineProps<{
  fileUpload: ReturnType<typeof useBulkImportFileUpload>;
  configDetails: ReturnType<typeof useBulkImportConfigDetails>;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-4">
    <label class="flex flex-col gap-2">
      <span>{{ t("integrations.bulkImport.configName") }}</span>
      <InputText v-model="props.configDetails.configName.value" />
    </label>
    <label class="flex flex-col gap-2">
      <JsonPathSelect
        :row="props.fileUpload.firstRow.value"
        v-model="props.configDetails.idField.value"
        :label="t('integrations.bulkImport.idField')"
      />
      <span class="text-surface-500 dark:text-surface-400 text-sm">{{
        t("integrations.bulkImport.idFieldHelp")
      }}</span>
    </label>
  </div>
</template>
