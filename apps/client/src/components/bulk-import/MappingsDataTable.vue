<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import type { MappingRow } from "../../composables/bulk-import/bulk-import-mapping.ts";

const props = defineProps<{
  mappings: MappingRow[];
  onRemoveMapping: (index: number) => void;
}>();

const { t } = useI18n();
</script>

<template>
  <DataTable :value="props.mappings" data-key="index">
    <Column field="input" :header="t('integrations.bulkImport.inputField')" />
    <Column field="submodelIdShort" :header="t('integrations.bulkImport.template')" />
    <Column field="output" :header="t('integrations.bulkImport.targetField')" />
    <Column>
      <template #body="{ index }">
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          :aria-label="t('common.delete')"
          @click="props.onRemoveMapping(index)"
        />
      </template>
    </Column>
  </DataTable>
</template>
