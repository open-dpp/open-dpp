<script lang="ts" setup>
import type {
  SubmodelElementCollectionResponseDto,
  SubmodelElementRequestDto,
} from "@open-dpp/dto";
import { Column, DataTable } from "primevue";
import { computed } from "vue";
import { useDisplayName } from "../../composables/display-name";
import SubmodelElementValue from "./SubmodelElementValue.vue";

const { content } = defineProps<{
  content: SubmodelElementCollectionResponseDto[];
}>();

const columns = computed(() => {
  if (content.length >= 1 && content[0] && content[0].value) {
    return content[0].value.map(collectionElement => ({
      header: useDisplayName(collectionElement.displayName).description.value,
      field: collectionElement.idShort,
    }));
  }
  else {
    return [];
  }
});

const rows = computed(() => {
  const result: Record<string, SubmodelElementRequestDto>[] = [];
  if (content.length >= 1) {
    for (let rowIndex = 0; rowIndex <= content.length; rowIndex++) {
      const row = content[rowIndex];
      if (row && row.value) {
        const rowRecord: Record<string, SubmodelElementRequestDto> = {};
        for (
          let columnIndex = 0;
          columnIndex <= row.value.length;
          columnIndex++
        ) {
          const key = columns.value[columnIndex]?.field;
          const value = row.value[columnIndex];
          if (key && value) {
            rowRecord[key] = value;
          }
        }

        result[rowIndex] = rowRecord;
      }
    }
  }

  return result;
});
</script>

<template>
  <DataTable :value="rows">
    <Column
      v-for="col of columns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
    >
      <template #body="slotProps">
        <SubmodelElementValue :element="slotProps.data[col.field]" />
      </template>
    </Column>
  </DataTable>
</template>
