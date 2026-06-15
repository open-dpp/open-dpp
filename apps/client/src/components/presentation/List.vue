<script lang="ts" setup>
import type {
  SubmodelElementCollectionResponseDto,
  SubmodelElementRequestDto,
} from "@open-dpp/dto";
import { computed } from "vue";
import SubmodelElementValue from "./SubmodelElementValue.vue";
import { buildColumns } from "./list-columns";

const { content, path } = defineProps<{
  content: SubmodelElementCollectionResponseDto[];
  path?: string;
}>();

const columns = computed(() => {
  return buildColumns(content);
});

const rows = computed(() => {
  const result: Record<string, SubmodelElementRequestDto>[] = [];
  if (content.length >= 1) {
    for (let rowIndex = 0; rowIndex < content.length; rowIndex++) {
      const row = content[rowIndex];
      if (row && row.value) {
        const rowRecord: Record<string, SubmodelElementRequestDto> = {};
        for (let columnIndex = 0; columnIndex < row.value.length; columnIndex++) {
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

function cellPath(field: string): string | undefined {
  return path ? `${path}.${field}` : undefined;
}
</script>

<template>
  <DataTable :value="rows" scrollable>
    <Column
      v-for="col of columns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      :style="col.style"
    >
      <template #body="slotProps">
        <SubmodelElementValue :element="slotProps.data[col.field]" :path="cellPath(col.field)" />
      </template>
    </Column>
  </DataTable>
</template>
