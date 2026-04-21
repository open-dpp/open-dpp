<script lang="ts" setup>
import type {
  SubmodelElementCollectionResponseDto,
  SubmodelElementRequestDto,
} from "@open-dpp/dto";
import { computed } from "vue";
import { useDisplayName } from "../../composables/display-name";
import SubmodelElementValue from "./SubmodelElementValue.vue";

const { content, path } = defineProps<{
  content: SubmodelElementCollectionResponseDto[];
  path?: string;
}>();

const columns = computed(() => {
  if (content.length >= 1 && content[0] && content[0].value) {
    return content[0].value.map((collectionElement) => ({
      header: useDisplayName(collectionElement.displayName).description.value,
      field: collectionElement.idShort,
    }));
  } else {
    return [];
  }
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

// SubmodelElementList rows share a schema, so all rows with the same leaf
// idShort resolve to the same component. Index-addressed per-row overrides are
// out of scope for v1 — the backend's IdShortPath uses dot-notation without
// indices.
function cellPath(field: string): string | undefined {
  return path ? `${path}.${field}` : undefined;
}
</script>

<template>
  <DataTable :value="rows">
    <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header">
      <template #body="slotProps">
        <SubmodelElementValue :element="slotProps.data[col.field]" :path="cellPath(col.field)" />
      </template>
    </Column>
  </DataTable>
</template>
