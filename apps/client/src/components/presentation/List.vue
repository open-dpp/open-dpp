<script lang="ts" setup>
import type { SubmodelElementCollectionResponseDto } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import SubmodelElementValue from "./SubmodelElementValue.vue";
import { buildColumns, buildGroupHeaders, buildRows, hasGroupColumns } from "./list-columns";

const { content, path } = defineProps<{
  content: SubmodelElementCollectionResponseDto[];
  path?: string;
}>();

const { locale } = useI18n();

const columns = computed(() => buildColumns(content, locale.value));
const rows = computed(() => buildRows(content, locale.value));
const hasGroups = computed(() => hasGroupColumns(content));
const groupHeaders = computed(() => buildGroupHeaders(content, locale.value));

function cellPath(field: string): string | undefined {
  return path ? `${path}.${field}` : undefined;
}
</script>

<template>
  <DataTable :value="rows" scrollable>
    <!-- Always render ColumnGroup — v-if on ColumnGroup itself causes PrimeVue to duplicate body cells -->
    <ColumnGroup type="header">
      <Row>
        <Column
          v-for="groupCol of groupHeaders"
          :key="groupCol.idShort"
          :header="groupCol.header"
          :colspan="groupCol.colspan"
          :rowspan="groupCol.isGroup ? 1 : hasGroups ? 2 : 1"
        />
      </Row>
      <Row v-if="hasGroups">
        <template v-for="groupCol of groupHeaders" :key="groupCol.idShort">
          <Column
            v-for="subCol of columns.filter((c) => c.groupIdShort === groupCol.idShort)"
            :key="subCol.field"
            :header="subCol.header"
          />
        </template>
      </Row>
    </ColumnGroup>
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
