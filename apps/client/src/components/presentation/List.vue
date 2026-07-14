<script lang="ts" setup>
import type { SubmodelElementCollectionResponseDto } from "@open-dpp/dto";
import { ChevronLeftIcon } from "@heroicons/vue/16/solid";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import NestedTableCell from "./NestedTableCell.vue";
import SubmodelElementValue from "./SubmodelElementValue.vue";
import { buildColumns, buildGroupHeaders, buildRows, hasGroupColumns } from "./list-columns";
import { buildTableQuery, parseTableSteps, resolveNestedTablePath } from "./nested-table-path";

const { content, path } = defineProps<{
  content: SubmodelElementCollectionResponseDto[];
  path?: string;
}>();

const { locale, t } = useI18n();
const route = useRoute();

const activeSteps = computed(() => parseTableSteps(path ?? "", route.query.table));
const resolved = computed(() => resolveNestedTablePath(content, activeSteps.value));
const displayedContent = computed(() => resolved.value.content);
const isNested = computed(() => resolved.value.resolvedSteps.length > 0);

/**
 * Flatten resolve steps to dot a separated path
 */
const flattenPath = computed(() =>
  resolved.value.resolvedSteps.reduce(
    (acc: string | undefined, step) => (acc ? `${acc}.${step.field}` : acc),
    path,
  ),
);

const columns = computed(() => buildColumns(displayedContent.value, locale.value));
const rows = computed(() => buildRows(displayedContent.value, locale.value));
const hasGroups = computed(() => hasGroupColumns(displayedContent.value));
const groupHeaders = computed(() => buildGroupHeaders(displayedContent.value, locale.value));

function cellPath(field: string): string | undefined {
  return flattenPath.value ? `${flattenPath.value}.${field}` : undefined;
}

function drillInQuery(field: string, rowIndex: number) {
  const rowIdShort = displayedContent.value[rowIndex]?.idShort;
  if (!path || !rowIdShort) return route.query;
  return buildTableQuery(route.query, path, [
    ...resolved.value.resolvedSteps,
    { field, rowIdShort },
  ]);
}

const parentQuery = computed(() =>
  path
    ? buildTableQuery(route.query, path, resolved.value.resolvedSteps.slice(0, -1))
    : route.query,
);
</script>

<template>
  <router-link
    v-if="isNested"
    :to="{ query: parentQuery }"
    class="text-primary-600 hover:text-primary-700 mb-2 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
  >
    <ChevronLeftIcon class="size-4 shrink-0" aria-hidden="true" />
    <span>{{ t("presentation.table.backToParentTable") }}</span>
  </router-link>
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
        <NestedTableCell
          v-if="col.isTableColumn"
          :element="slotProps.data[col.field]"
          :query="drillInQuery(col.field, slotProps.index)"
        />
        <SubmodelElementValue
          v-else
          :element="slotProps.data[col.field]"
          :path="cellPath(col.field)"
        />
      </template>
    </Column>
  </DataTable>
</template>
